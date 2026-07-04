import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMarkersFromFile } from "@/lib/ai/bloodwork-extract";
import {
  isOpenAiExtractionConfigured,
  OPENAI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/extraction-config";
import { formatBloodworkInsertError } from "@/lib/bloodwork/db-errors";
import { EXPECTED_CLINIPATH_MARKER_COUNT } from "@/lib/bloodwork/clinipath-parser";
import { runStrictExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";
import {
  EXTRACTION_TIMEOUT_MS,
  ExtractionTimeoutError,
  withTimeout,
} from "@/lib/bloodwork/extraction-timeout";
import { traceAndParsePdf } from "@/lib/bloodwork/extraction-trace";
import { buildExtractionSnapshot } from "@/lib/bloodwork/parsed-to-result";
import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";
import { toBloodworkResultRows } from "@/lib/bloodwork/result-row";
import { getReportStoragePath, resolveReportFilePath } from "@/lib/bloodwork/upload";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "bloodwork-reports";
const NO_MARKERS_MESSAGE = "No blood markers could be extracted from this PDF.";

function resolveFileUrl(report: {
  file_url?: string | null;
  uploaded_file_url?: string | null;
}): string | null {
  const url = report.file_url?.trim() || "";
  if (url.startsWith("http")) return url;
  const legacy = report.uploaded_file_url?.trim() || "";
  if (legacy.startsWith("http")) return legacy;
  return null;
}

async function downloadReportFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  report: {
    file_path?: string | null;
    uploaded_file_url?: string | null;
    file_url?: string | null;
    file_type?: string | null;
    file_name?: string | null;
  }
): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
  const storagePath = getReportStoragePath(report);
  if (storagePath) {
    console.log("[bloodwork/extract] Downloading PDF from storage:", storagePath);
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (!downloadError && fileBlob) {
      console.log("[bloodwork/extract] PDF downloaded from storage");
      return {
        buffer: Buffer.from(await fileBlob.arrayBuffer()),
        mimeType: report.file_type || fileBlob.type || "application/octet-stream",
        fileName: report.file_name ?? storagePath.split("/").pop() ?? "report",
      };
    }

    console.error("[bloodwork/extract] Storage download failed", downloadError);
  }

  const fileUrl = resolveFileUrl(report);
  if (!fileUrl) return null;

  console.log("[bloodwork/extract] Downloading PDF from URL...");
  const response = await fetch(fileUrl);
  if (!response.ok) {
    console.error("[bloodwork/extract] URL download failed", response.status);
    return null;
  }

  console.log("[bloodwork/extract] PDF downloaded from URL");
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType:
      report.file_type ||
      response.headers.get("content-type") ||
      "application/octet-stream",
    fileName: report.file_name ?? "report",
  };
}

function isPdf(mimeType: string, fileName: string) {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: isOpenAiExtractionConfigured(),
    pdfParserAvailable: true,
    setupInstructions: isOpenAiExtractionConfigured() ? null : OPENAI_SETUP_INSTRUCTIONS,
  });
}

export async function POST(request: Request) {
  let reportId: string;
  try {
    const body = (await request.json()) as { reportId?: string };
    reportId = body.reportId ?? "";
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "reportId is required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[bloodwork/extract] Extraction request received", { reportId });

  try {
    const response = await withTimeout(
      () => runExtraction(reportId),
      EXTRACTION_TIMEOUT_MS,
      "Bloodwork extraction"
    );
    console.log("[bloodwork/extract] Returning response");
    return response;
  } catch (err) {
    if (err instanceof ExtractionTimeoutError) {
      console.error("[bloodwork/extract] Extraction timed out", err);
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          code: "extraction_timeout",
        },
        { status: 504 }
      );
    }

    console.error("PDF extraction failed:", err);
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[bloodwork/extract] extraction failed", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

async function runExtraction(reportId: string): Promise<NextResponse> {
  console.log("[bloodwork/extract] Authenticating user...");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  console.log("[bloodwork/extract] Loading report...");
  const { data: report, error: reportError } = await supabase
    .from("bloodwork_reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (reportError) {
    return NextResponse.json({ success: false, error: reportError.message }, { status: 500 });
  }
  if (!report) {
    return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
  }

  try {
    resolveReportFilePath(report);
  } catch (fileError) {
    const message = fileError instanceof Error ? fileError.message : "No uploaded file found";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  console.log("[bloodwork/extract] Downloading PDF...");
  const downloaded = await downloadReportFile(supabase, report);
  if (!downloaded) {
    return NextResponse.json(
      { success: false, error: "Failed to download file from storage" },
      { status: 500 }
    );
  }

  const { buffer, mimeType, fileName } = downloaded;
  console.log("[bloodwork/extract] PDF downloaded", {
    fileName,
    mimeType,
    bytes: buffer.length,
  });

  const pdf = isPdf(mimeType, fileName);

  if (!pdf && !isOpenAiExtractionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        code: "setup_required",
        error: "Bloodwork extraction is not configured",
        message: OPENAI_SETUP_INSTRUCTIONS,
      },
      { status: 503 }
    );
  }

  let parser: "pdf" | "openai" = "openai";
  let structuredSnapshot: ReturnType<typeof buildExtractionSnapshot> = [];
  let extractedMarkers: ParsedBloodworkMarker[] = [];
  let mappedMarkers: unknown[] = [];
  let validatedMarkers: ReturnType<typeof prepareMarkersForInsert>["validated"] = [];
  let skippedMarkers: ReturnType<typeof prepareMarkersForInsert>["skipped"] = [];
  let validMarkers: ReturnType<typeof prepareMarkersForInsert>["valid"] = [];
  const warnings: string[] = [];

  if (pdf) {
    console.log("[bloodwork/extract] Parsing PDF...");
    const { trace, parseResult: parsed } = await traceAndParsePdf(buffer);
    console.log("[bloodwork/extract] PDF parsed");
    extractedMarkers = parsed.finalMarkers;
    structuredSnapshot = buildExtractionSnapshot(extractedMarkers);
    parser = "pdf";

    console.log("[bloodwork/extract] Running Clinipath parser pipeline...");
    const pipeline = runStrictExtractionPipeline(extractedMarkers);
    mappedMarkers = pipeline.mappedMarkers;
    validatedMarkers = pipeline.validatedMarkers;
    skippedMarkers = pipeline.skippedMarkers;
    validMarkers = pipeline.validMarkers;
    console.log("[bloodwork/extract] Markers extracted:", validMarkers.length);

    if (validMarkers.length < EXPECTED_CLINIPATH_MARKER_COUNT) {
      console.warn("MISSING BLOODWORK MARKERS:", parsed.missingMarkers);
      warnings.push(
        `Only ${validMarkers.length} of ${EXPECTED_CLINIPATH_MARKER_COUNT} expected markers were extracted. Missing: ${parsed.missingMarkers.join(", ")}`
      );
      return NextResponse.json(
        {
          success: false,
          code: "incomplete_extraction",
          error: `Incomplete extraction: found ${validMarkers.length} of ${EXPECTED_CLINIPATH_MARKER_COUNT} expected markers.`,
          message: `Incomplete extraction: found ${validMarkers.length} of ${EXPECTED_CLINIPATH_MARKER_COUNT} expected markers. Missing: ${parsed.missingMarkers.join(", ")}`,
          missingMarkers: parsed.missingMarkers,
          emptyPdfPages: trace.pdfExtraction.pages
            .filter((page) => page.isEmpty)
            .map((page) => page.pageNumber),
          pageCount: trace.pdfExtraction.pageCount,
          textExtractionMethod: trace.textExtractionMethod,
          ocrUsed: trace.ocrUsed,
          pageExtractionStats: trace.pdfExtraction.pages.map((page) => ({
            pageNumber: page.pageNumber,
            pdfJsCharCount: page.pdfJsCharCount,
            ocrCharCount: page.ocrCharCount,
            finalCharCount: page.charCount,
            ocrUsed: page.ocrUsed,
          })),
          markerDiagnostics: trace.missingMarkerDiagnostics,
          extractedCount: validMarkers.length,
          warnings,
          parser,
        },
        { status: 422 }
      );
    }
  } else {
    console.log("[bloodwork/extract] Running AI extraction...");
    const rawMarkers = await extractMarkersFromFile(buffer, mimeType, fileName);
    console.log("[bloodwork/extract] AI extraction complete", {
      markers: rawMarkers.length,
    });

    mappedMarkers = rawMarkers.map((m) => ({
      category: m.panel,
      panel: m.panel,
      marker_name: m.name,
      marker: m.name,
      result_value: m.value,
      numeric_value: m.value,
      unit: m.unit,
      reference_low: m.reference_low,
      reference_high: m.reference_high,
      range_low: m.reference_low,
      range_high: m.reference_high,
      result_text: m.result_text,
      reference_range: m.reference_range,
    }));

    const prepared = prepareMarkersForInsert(mappedMarkers);
    validatedMarkers = prepared.validated;
    skippedMarkers = prepared.skipped;
    validMarkers = prepared.valid;
    console.log("[bloodwork/extract] Markers extracted:", validMarkers.length);
  }

  console.log("SKIPPED MARKERS:", skippedMarkers);

  if (skippedMarkers.length > 0) {
    warnings.push(
      `${skippedMarkers.length} marker(s) were skipped because they were invalid, unapproved, or duplicated.`
    );
  }

  if (validMarkers.length === 0) {
    return NextResponse.json(
      {
        success: false,
        code: "no_markers",
        error: pdf ? NO_MARKERS_MESSAGE : "No blood markers could be extracted from this file.",
        message: pdf ? NO_MARKERS_MESSAGE : "No blood markers could be extracted from this file.",
        warnings,
      },
      { status: 422 }
    );
  }

  console.log("[bloodwork/extract] Saving markers...");
  const rowsToInsert = toBloodworkResultRows(reportId, user.id, validMarkers);

  const { error: deleteError } = await supabase
    .from("bloodwork_results")
    .delete()
    .eq("report_id", reportId);
  if (deleteError) {
    console.error("[bloodwork/extract] failed to clear existing markers", deleteError);
    return NextResponse.json(
      { success: false, error: formatBloodworkInsertError(deleteError.message) },
      { status: 500 }
    );
  }

  const { error: insertError } = await supabase.from("bloodwork_results").insert(rowsToInsert);
  if (insertError) {
    console.error("[bloodwork/extract] failed to save markers", {
      reportId,
      error: insertError,
      rowsToInsert,
    });
    return NextResponse.json(
      { success: false, error: formatBloodworkInsertError(insertError.message) },
      { status: 500 }
    );
  }
  console.log("[bloodwork/extract] Database save complete");

  const { error: updateError } = await supabase
    .from("bloodwork_reports")
    .update({
      status: "complete",
      extraction_snapshot: structuredSnapshot.length > 0 ? structuredSnapshot : validatedMarkers,
    })
    .eq("id", reportId)
    .eq("user_id", user.id);
  if (updateError) {
    console.error("[bloodwork/extract] failed to update report status", updateError);
    return NextResponse.json(
      { success: false, error: formatBloodworkInsertError(updateError.message) },
      { status: 500 }
    );
  }

  const structured_markers = validatedMarkers.map((m) => ({
    panel: m.category,
    marker: m.marker_name,
    result: m.result_value,
    numeric_value: m.numeric_value,
    comparator: null,
    flag: null,
    unit: m.units,
    reference_range: m.reference_range ?? "",
    range_low: null,
    range_high: null,
    status:
      m.status === "Low" ? "low" : m.status === "High" ? "high" : m.status === "Normal" ? "normal" : "unknown",
  }));

  return NextResponse.json({
    success: true,
    markers: validatedMarkers.map((m) => ({
      marker_name: m.marker_name,
      category: m.category,
      result_value: m.numeric_value,
      unit: m.units,
      reference_low: null,
      reference_high: null,
      status: m.status,
      result_text: m.result_value,
      comparator: null,
      flag: null,
      reference_range: m.reference_range,
      marker_id: null,
      raw_name: m.marker_name,
      matched: true,
    })),
    structured_markers,
    warnings,
    extractedCount: validMarkers.length,
    matchedCount: validMarkers.length,
    saved: true,
    parser,
  });
}
