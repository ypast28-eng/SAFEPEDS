import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMarkersFromFile } from "@/lib/ai/bloodwork-extract";
import {
  isOpenAiExtractionConfigured,
  OPENAI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/extraction-config";
import { formatBloodworkInsertError } from "@/lib/bloodwork/db-errors";
import { runStrictExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";
import { buildExtractionSnapshot } from "@/lib/bloodwork/parsed-to-result";
import { parseBloodworkPdfTextWithMeta } from "@/lib/bloodwork/parseBloodworkPdf";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";
import { toBloodworkResultRows } from "@/lib/bloodwork/result-row";
import { getReportStoragePath } from "@/lib/bloodwork/upload";

export const runtime = "nodejs";

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
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (!downloadError && fileBlob) {
      return {
        buffer: Buffer.from(await fileBlob.arrayBuffer()),
        mimeType: report.file_type || fileBlob.type || "application/octet-stream",
        fileName: report.file_name ?? storagePath.split("/").pop() ?? "report",
      };
    }
  }

  const fileUrl = resolveFileUrl(report);
  if (!fileUrl) return null;

  const response = await fetch(fileUrl);
  if (!response.ok) return null;

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
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: report, error: reportError } = await supabase
      .from("bloodwork_reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const storagePath = getReportStoragePath(report);
    const fileUrl = resolveFileUrl(report);
    if (!storagePath && !fileUrl) {
      return NextResponse.json({ error: "This report has no uploaded file" }, { status: 400 });
    }

    const downloaded = await downloadReportFile(supabase, report);
    if (!downloaded) {
      return NextResponse.json(
        { error: "Failed to download file from storage" },
        { status: 500 }
      );
    }

    const { buffer, mimeType, fileName } = downloaded;
    const pdf = isPdf(mimeType, fileName);

    if (!pdf && !isOpenAiExtractionConfigured()) {
      return NextResponse.json(
        {
          code: "setup_required",
          error: "Bloodwork extraction is not configured",
          message: OPENAI_SETUP_INSTRUCTIONS,
        },
        { status: 503 }
      );
    }

    let parser: "pdf" | "openai" = "openai";
    let structuredSnapshot: ReturnType<typeof buildExtractionSnapshot> = [];
    let extractedMarkers: ReturnType<typeof parseBloodworkPdfTextWithMeta>["finalMarkers"] = [];
    let mappedMarkers: unknown[] = [];
    let validatedMarkers: ReturnType<typeof prepareMarkersForInsert>["validated"] = [];
    let skippedMarkers: ReturnType<typeof prepareMarkersForInsert>["skipped"] = [];
    let validMarkers: ReturnType<typeof prepareMarkersForInsert>["valid"] = [];
    let rawText = "";

    if (pdf) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsedPdf = await pdfParse(buffer);
      rawText = parsedPdf.text ?? "";
      const parsed = parseBloodworkPdfTextWithMeta(rawText);
      extractedMarkers = parsed.finalMarkers;
      structuredSnapshot = buildExtractionSnapshot(extractedMarkers);
      parser = "pdf";

      const pipeline = runStrictExtractionPipeline(extractedMarkers);
      mappedMarkers = pipeline.mappedMarkers;
      validatedMarkers = pipeline.validatedMarkers;
      skippedMarkers = pipeline.skippedMarkers;
      validMarkers = pipeline.validMarkers;
    } else {
      const rawMarkers = await extractMarkersFromFile(buffer, mimeType, fileName);
      rawText = JSON.stringify(rawMarkers);
      console.log("Raw OCR text:", rawText);
      console.log("Extracted markers:", rawMarkers);

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
    }

    console.log("SKIPPED MARKERS:", skippedMarkers);

    const warnings: string[] = [];
    if (skippedMarkers.length > 0) {
      warnings.push(
        `${skippedMarkers.length} marker(s) were skipped because they were invalid, unapproved, or duplicated.`
      );
    }

    if (validMarkers.length === 0) {
      return NextResponse.json(
        {
          code: "no_markers",
          error: pdf ? NO_MARKERS_MESSAGE : "No blood markers could be extracted from this file.",
          message: pdf ? NO_MARKERS_MESSAGE : "No blood markers could be extracted from this file.",
          warnings,
        },
        { status: 422 }
      );
    }

    const rowsToInsert = toBloodworkResultRows(reportId, user.id, validMarkers);

    await supabase.from("bloodwork_results").delete().eq("report_id", reportId);

    const { error: insertError } = await supabase.from("bloodwork_results").insert(rowsToInsert);
    if (insertError) {
      console.error("[bloodwork/extract] failed to save markers", {
        reportId,
        error: insertError,
        rowsToInsert,
      });
      return NextResponse.json(
        { error: formatBloodworkInsertError(insertError.message) },
        { status: 500 }
      );
    }

    await supabase
      .from("bloodwork_reports")
      .update({
        status: "complete",
        extraction_snapshot: structuredSnapshot.length > 0 ? structuredSnapshot : validatedMarkers,
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[bloodwork/extract] extraction failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
