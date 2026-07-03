import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMarkersFromFile } from "@/lib/ai/bloodwork-extract";
import {
  isOpenAiExtractionConfigured,
  OPENAI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/extraction-config";
import { matchExtractedMarkers } from "@/lib/bloodwork/match-markers";
import { buildExtractionSnapshot, parsedMarkerToRaw } from "@/lib/bloodwork/parsed-to-result";
import { parseBloodworkPdfBuffer } from "@/lib/bloodwork/parseBloodworkPdf";
import { toBloodworkResultRow } from "@/lib/bloodwork/result-row";
import { getReportStoragePath } from "@/lib/bloodwork/upload";
import type { BloodMarker } from "@/types/bloodwork";

export const runtime = "nodejs";

const BUCKET = "bloodwork-reports";

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
    let structuredSnapshot;

    if (pdf) {
      const parsed = await parseBloodworkPdfBuffer(buffer);
      rawMarkers = parsed.map(parsedMarkerToRaw);
      structuredSnapshot = buildExtractionSnapshot(parsed);
      parser = "pdf";
    } else {
      rawMarkers = await extractMarkersFromFile(buffer, mimeType, fileName);
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
        status: "unknown",
        bloodwork_status: null,
      }));
    }

    const markers = matchExtractedMarkers(rawMarkers, (catalog ?? []) as BloodMarker[]);
    const matchedCount = markers.filter((m) => m.matched).length;
    const warnings: string[] = [];

    if (matchedCount < markers.length) {
      warnings.push(
        `${markers.length - matchedCount} marker(s) could not be matched to the catalog — names were preserved from the PDF.`
      );
    }

    const resultInputs = markers.map((m) => ({
      panel: m.category,
      marker: m.marker_name,
      result: m.result_text ?? String(m.result_value),
      numeric_value: m.result_value,
      range_low: m.reference_low,
      range_high: m.reference_high,
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
    }));

    await supabase.from("bloodwork_results").delete().eq("report_id", reportId);

    if (resultInputs.length > 0) {
      const rows = resultInputs.map((r) => toBloodworkResultRow(reportId, user.id, r));
      const { error: insertError } = await supabase.from("bloodwork_results").insert(rows);
      if (insertError) {
        console.error("[bloodwork/extract] failed to save markers", {
          reportId,
          error: insertError,
        });
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
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
      markers: markers.map((m) => ({
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
      extractedCount: markers.length,
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
