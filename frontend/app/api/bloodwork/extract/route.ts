import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMarkersFromFile } from "@/lib/ai/bloodwork-extract";
import {
  isOpenAiExtractionConfigured,
  OPENAI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/extraction-config";
import { formatBloodworkInsertError } from "@/lib/bloodwork/db-errors";
import { runExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";
import { buildExtractionSnapshot, parsedMarkerToRaw } from "@/lib/bloodwork/parsed-to-result";
import { parseBloodworkPdfText } from "@/lib/bloodwork/parseBloodworkPdf";
import { toBloodworkResultRows } from "@/lib/bloodwork/result-row";
import { getReportStoragePath } from "@/lib/bloodwork/upload";
import type { BloodMarker } from "@/types/bloodwork";

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

    const { data: catalog, error: catalogError } = await supabase
      .from("blood_markers")
      .select("*")
      .eq("active", true);

    if (catalogError) {
      return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    let rawMarkers;
    let parser: "pdf" | "openai" = "openai";
    let structuredSnapshot: ReturnType<typeof buildExtractionSnapshot> = [];

    if (pdf) {
      const pdfParse = (await import("pdf-parse")).default;
      const parsedPdf = await pdfParse(buffer);
      const pdfText = parsedPdf.text ?? "";
      const parsedMarkers = parseBloodworkPdfText(pdfText);

      console.log("[bloodwork/extract] PDF parser response", {
        reportId,
        textLength: pdfText.length,
        textPreview: pdfText.slice(0, 500),
        parsedMarkerCount: parsedMarkers.length,
        parsedMarkers,
      });

      if (parsedMarkers.length === 0) {
        console.log("[bloodwork/extract] Extracted markers:", []);
        console.log("[bloodwork/extract] Mapped markers:", []);
        console.log("[bloodwork/extract] Markers being inserted:", []);
        return NextResponse.json(
          {
            code: "no_markers",
            error: NO_MARKERS_MESSAGE,
            message: NO_MARKERS_MESSAGE,
          },
          { status: 422 }
        );
      }

      rawMarkers = parsedMarkers.map(parsedMarkerToRaw);
      structuredSnapshot = buildExtractionSnapshot(parsedMarkers);
      parser = "pdf";
    } else {
      rawMarkers = await extractMarkersFromFile(buffer, mimeType, fileName);
      console.log("[bloodwork/extract] OpenAI parser response", {
        reportId,
        rawMarkerCount: rawMarkers.length,
        rawMarkers,
      });

      if (rawMarkers.length === 0) {
        console.log("[bloodwork/extract] Extracted markers:", []);
        console.log("[bloodwork/extract] Mapped markers:", []);
        console.log("[bloodwork/extract] Markers being inserted:", []);
        return NextResponse.json(
          {
            code: "no_markers",
            error: "No blood markers could be extracted from this file.",
            message: "No blood markers could be extracted from this file.",
          },
          { status: 422 }
        );
      }

      structuredSnapshot = rawMarkers.map((m) => ({
        panel: "General",
        marker: m.name,
        result: String(m.value),
        numeric_value: m.value,
        comparator: null,
        flag: null,
        unit: m.unit,
        reference_range:
          m.reference_low != null && m.reference_high != null
            ? `${m.reference_low} - ${m.reference_high}`
            : m.reference_high != null
              ? `<${m.reference_high}`
              : m.reference_low != null
                ? `>${m.reference_low}`
                : "",
        range_low: m.reference_low,
        range_high: m.reference_high,
        status: "unknown" as const,
        bloodwork_status: null,
      }));
    }

    console.log("Extracted markers:", rawMarkers);

    const pipeline = runExtractionPipeline(rawMarkers, (catalog ?? []) as BloodMarker[]);
    const { matched, mappedMarkers, validMarkers, skipped, matchedCount } = pipeline;

    console.log("Mapped markers:", mappedMarkers);

    const warnings: string[] = [];
    if (matchedCount < matched.length) {
      warnings.push(
        `${matched.length - matchedCount} marker(s) could not be matched to the catalog — names were preserved from the PDF.`
      );
    }
    if (skipped.length > 0) {
      warnings.push(
        `${skipped.length} marker(s) were skipped because they were invalid or duplicated.`
      );
      console.log("[bloodwork/extract] Skipped markers", skipped);
    }

    if (validMarkers.length === 0) {
      console.log("Markers being inserted:", []);
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
    console.log("Markers being inserted:", rowsToInsert);

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
        extraction_snapshot: structuredSnapshot,
      })
      .eq("id", reportId)
      .eq("user_id", user.id);

    const structured_markers = structuredSnapshot.map((m) => ({
      panel: m.panel,
      marker: m.marker,
      result: m.result,
      numeric_value: m.numeric_value,
      comparator: m.comparator,
      flag: m.flag,
      unit: m.unit,
      reference_range: m.reference_range,
      range_low: m.range_low,
      range_high: m.range_high,
      status: m.status,
    }));

    return NextResponse.json({
      markers: matched.map((m) => ({
        marker_name: m.marker_name,
        category: m.category,
        result_value: m.result_value,
        unit: m.unit,
        reference_low: m.reference_low,
        reference_high: m.reference_high,
        status: m.status,
        result_text: m.result_text,
        comparator: m.comparator,
        flag: m.flag,
        reference_range: m.reference_range,
        marker_id: m.marker_id,
        raw_name: m.raw_name,
        matched: m.matched,
      })),
      structured_markers,
      warnings,
      extractedCount: validMarkers.length,
      matchedCount,
      saved: true,
      parser,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    console.error("[bloodwork/extract] extraction failed", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
