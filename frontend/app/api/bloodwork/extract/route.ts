import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractMarkersFromFile } from "@/lib/ai/bloodwork-extract";
import {
  isOpenAiExtractionConfigured,
  OPENAI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/extraction-config";
import { matchExtractedMarkers } from "@/lib/bloodwork/match-markers";
import type { BloodMarker } from "@/types/bloodwork";

export const runtime = "nodejs";

const BUCKET = "bloodwork-reports";

function getStoragePath(report: {
  file_path?: string | null;
  uploaded_file_url?: string | null;
}): string | null {
  return report.file_path ?? report.uploaded_file_url ?? null;
}

export async function GET() {
  return NextResponse.json({
    configured: isOpenAiExtractionConfigured(),
    setupInstructions: isOpenAiExtractionConfigured() ? null : OPENAI_SETUP_INSTRUCTIONS,
  });
}

export async function POST(request: Request) {
  if (!isOpenAiExtractionConfigured()) {
    return NextResponse.json(
      {
        code: "setup_required",
        error: "Bloodwork extraction is not configured",
        message: OPENAI_SETUP_INSTRUCTIONS,
      },
      { status: 503 }
    );
  }

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

    const storagePath = getStoragePath(report);
    if (!storagePath) {
      return NextResponse.json({ error: "This report has no uploaded file" }, { status: 400 });
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (downloadError || !fileBlob) {
      return NextResponse.json(
        { error: downloadError?.message ?? "Failed to download file from storage" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const mimeType = report.file_type || fileBlob.type || "application/octet-stream";
    const fileName = report.file_name ?? storagePath.split("/").pop() ?? "report";

    const rawMarkers = await extractMarkersFromFile(buffer, mimeType, fileName);

    const { data: catalog, error: catalogError } = await supabase
      .from("blood_markers")
      .select("*")
      .eq("active", true);

    if (catalogError) {
      return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    const markers = matchExtractedMarkers(rawMarkers, (catalog ?? []) as BloodMarker[]);
    const matchedCount = markers.filter((m) => m.matched).length;
    const warnings: string[] = [];

    if (matchedCount < markers.length) {
      warnings.push(
        `${markers.length - matchedCount} marker(s) could not be matched to the catalog — review names before saving.`
      );
    }

    await supabase
      .from("bloodwork_reports")
      .update({ status: "pending_review" })
      .eq("id", reportId)
      .eq("user_id", user.id);

    return NextResponse.json({
      markers,
      warnings,
      extractedCount: markers.length,
      matchedCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
