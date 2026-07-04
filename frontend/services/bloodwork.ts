import { calculateStatus } from "@/lib/bloodwork/status";
import { resolveBloodworkPhase } from "@/lib/bloodwork/phase";
import { sortBloodworkReportsByRecency } from "@/lib/bloodwork/report-sort";
import { formatBloodworkInsertError } from "@/lib/bloodwork/db-errors";
import { normalizeBloodworkResults } from "@/lib/bloodwork/normalize-result";
import { bloodworkResultToDbFields, toBloodworkResultRow } from "@/lib/bloodwork/result-row";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { tryCreateClient } from "@/lib/supabase/client";
import { MOCK_BLOOD_MARKERS } from "@/lib/mock/compounds";
import {
  localAppendResultsToReport,
  localCreateReportWithResults,
  localDeleteReport,
  localFetchHistoryForMarker,
  localFetchReportById,
  localFetchReportsWithStats,
  localUpdateReportWithResults,
} from "@/lib/local-storage/bloodwork";
import type {
  BloodMarker,
  BloodworkDashboardStats,
  BloodworkExtractionResult,
  BloodworkHistoryPoint,
  BloodworkReport,
  BloodworkReportStatus,
  BloodworkReportWithResults,
  BloodworkResultInput,
  CreateReportInput,
  ExtractedBloodworkMarker,
  TrendTimeRange,
  UpdateBloodworkReportInput,
} from "@/types/bloodwork";

export { calculateStatus } from "@/lib/bloodwork/status";

const BUCKET = "bloodwork-reports";

function normalizePhase(phase: unknown): import("@/types/bloodwork").BloodworkPhase | null {
  if (phase === "cruise" || phase === "blast" || phase === "off" || phase === "unknown") {
    return phase;
  }
  return null;
}

function normalizeReport<T extends BloodworkReport & { bloodwork_results?: { length: number } }>(
  row: T
): T {
  const results = normalizeBloodworkResults(
    (Array.isArray(row.bloodwork_results) ? row.bloodwork_results : []) as Record<string, unknown>[]
  );
  const resultsCount = results.length;
  const filePath =
    (typeof row.file_path === "string" && row.file_path.trim()) ||
    (typeof row.uploaded_file_url === "string" &&
    !row.uploaded_file_url.startsWith("http")
      ? row.uploaded_file_url.trim()
      : null) ||
    null;
  const legacyUrl =
    typeof row.uploaded_file_url === "string" && row.uploaded_file_url.startsWith("http")
      ? row.uploaded_file_url.trim()
      : null;
  return {
    ...row,
    phase: normalizePhase(row.phase),
    bloodwork_results: results as T["bloodwork_results"],
    file_name: row.file_name ?? null,
    file_type: row.file_type ?? null,
    file_size: row.file_size ?? null,
    file_path: filePath,
    file_url: row.file_url ?? legacyUrl ?? null,
    uploaded_file_url: filePath ?? row.uploaded_file_url ?? null,
    status:
      row.status ??
      (resultsCount > 0 ? "complete" : filePath || legacyUrl ? "uploaded" : "uploaded"),
  };
}

function reportInsertPayload(userId: string, input: Omit<CreateReportInput, "results">) {
  return {
    user_id: userId,
    report_name: input.report_name.trim(),
    lab_name: input.lab_name?.trim() || null,
    collection_date: input.collection_date,
    phase: resolveBloodworkPhase(input.phase),
    notes: input.notes?.trim() || null,
    file_name: input.file_name ?? null,
    file_type: input.file_type ?? null,
    status: input.status ?? "uploaded",
  };
}

function buildDashboardStats(enriched: BloodworkReportWithResults[]): BloodworkDashboardStats {
  const sorted = sortBloodworkReportsByRecency(enriched);
  const latestReport = sorted[0] ?? null;
  const latestCruiseReport = sorted.find((r) => r.phase === "cruise") ?? null;
  const latestBlastReport = sorted.find((r) => r.phase === "blast") ?? null;

  return {
    totalReports: sorted.length,
    latestReport,
    previousReports: sorted.slice(1),
    totalOutOfRange: latestReport?.out_of_range_count ?? 0,
    latestCruiseReport,
    latestBlastReport,
    hasCruiseBaseline: latestCruiseReport != null,
  };
}

export async function fetchBloodMarkers(): Promise<{
  data: BloodMarker[];
  error: string | null;
}> {
  if (!isSupabaseEnvConfigured()) {
    return { data: MOCK_BLOOD_MARKERS as BloodMarker[], error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase
    .from("blood_markers")
    .select("*")
    .eq("active", true)
    .order("display_order");

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as BloodMarker[], error: null };
}

export async function fetchReportsWithStats(): Promise<{
  data: BloodworkDashboardStats;
  error: string | null;
}> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localFetchReportsWithStats(), error: null };
  }

  const supabase = tryCreateClient()!;
  const { data: reports, error } = await supabase
    .from("bloodwork_reports")
    .select(`*, bloodwork_results (*)`)
    .order("collection_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: {
        totalReports: 0,
        latestReport: null,
        previousReports: [],
        totalOutOfRange: 0,
        latestCruiseReport: null,
        latestBlastReport: null,
        hasCruiseBaseline: false,
      },
      error: error.message,
    };
  }

  const enriched: BloodworkReportWithResults[] = sortBloodworkReportsByRecency(
    (reports ?? []).map((r) => {
      const row = r as Record<string, unknown> & {
        bloodwork_results?: Record<string, unknown>[];
      };
      const results = normalizeBloodworkResults(row.bloodwork_results);
      const out_of_range_count = results.filter(
        (res) => res.status === "Low" || res.status === "High"
      ).length;
      return { ...row, bloodwork_results: results, out_of_range_count } as BloodworkReportWithResults;
    }).map((row) => normalizeReport(row))
  );

  return {
    data: buildDashboardStats(enriched),
    error: null,
  };
}

export async function fetchReportById(
  id: string
): Promise<{ data: BloodworkReportWithResults | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localFetchReportById(id), error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase
    .from("bloodwork_reports")
    .select(`*, bloodwork_results (*)`)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const results = normalizeBloodworkResults(
    (data as { bloodwork_results?: Record<string, unknown>[] }).bloodwork_results
  ).sort((a, b) =>
    a.marker_name.localeCompare(b.marker_name)
  );
  return {
    data: {
      ...normalizeReport({
        ...data,
        bloodwork_results: results,
        out_of_range_count: results.filter((r) => r.status === "Low" || r.status === "High").length,
      } as BloodworkReportWithResults),
    } as BloodworkReportWithResults,
    error: null,
  };
}

export async function createReportWithResults(
  userId: string,
  input: CreateReportInput
): Promise<{ data: BloodworkReport | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localCreateReportWithResults(input), error: null };
  }

  const supabase = tryCreateClient()!;

  const { data: report, error: reportError } = await supabase
    .from("bloodwork_reports")
    .insert({
      ...reportInsertPayload(userId, input),
      status: input.status ?? (input.results.length > 0 ? "complete" : "uploaded"),
    })
    .select()
    .single();

  if (reportError) return { data: null, error: reportError.message };

  if (input.results.length > 0) {
    const { valid, skipped } = prepareMarkersForInsert(input.results);
    if (valid.length === 0) {
      await supabase.from("bloodwork_reports").delete().eq("id", report.id);
      return {
        data: null,
        error:
          skipped.length > 0
            ? "No valid marker results to save. Check marker names and numeric values."
            : "Add at least one valid marker result.",
      };
    }

    const rows = valid.map((r) => toBloodworkResultRow(report.id, userId, r));

    const { error: resultsError } = await supabase.from("bloodwork_results").insert(rows);
    if (resultsError) {
      await supabase.from("bloodwork_reports").delete().eq("id", report.id);
      return { data: null, error: formatBloodworkInsertError(resultsError.message) };
    }
  }

  return { data: report as BloodworkReport, error: null };
}

export async function uploadReportFile(
  userId: string,
  reportId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { url: null, error: "File upload requires Supabase configuration." };
  }

  const supabase = tryCreateClient()!;
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${reportId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);

  const { error: updateError } = await supabase
    .from("bloodwork_reports")
    .update({
      file_path: path,
      uploaded_file_url: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: signed?.signedUrl ?? null,
    })
    .eq("id", reportId);

  if (updateError) return { url: null, error: updateError.message };

  return { url: path, error: null };
}

export async function createReportWithFile(
  userId: string,
  input: Omit<CreateReportInput, "results">,
  file: File
): Promise<{ data: BloodworkReport | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: null, error: "File upload requires Supabase. Sign in and configure your project." };
  }

  const supabase = tryCreateClient()!;

  const { data: report, error: reportError } = await supabase
    .from("bloodwork_reports")
    .insert({
      ...reportInsertPayload(userId, {
        ...input,
        file_name: file.name,
        file_type: file.type,
        status: "uploaded",
      }),
    })
    .select()
    .single();

  if (reportError) return { data: null, error: reportError.message };

  const { error: uploadError } = await uploadReportFile(userId, report.id, file);
  if (uploadError) {
    await supabase.from("bloodwork_reports").delete().eq("id", report.id);
    return { data: null, error: uploadError };
  }

  const { data: updated, error: fetchError } = await supabase
    .from("bloodwork_reports")
    .select("*")
    .eq("id", report.id)
    .single();

  if (fetchError) return { data: report as BloodworkReport, error: null };
  return { data: normalizeReport(updated as BloodworkReport), error: null };
}

export async function updateReportStatus(
  reportId: string,
  status: BloodworkReportStatus
): Promise<{ error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { error: "Supabase is not configured." };
  }

  const supabase = tryCreateClient()!;
  const { error } = await supabase
    .from("bloodwork_reports")
    .update({ status })
    .eq("id", reportId);

  return { error: error?.message ?? null };
}

export async function appendResultsToReport(
  reportId: string,
  results: BloodworkResultInput[]
): Promise<{ error: string | null }> {
  if (results.length === 0) return { error: null };

  if (!isSupabaseEnvConfigured()) {
    localAppendResultsToReport(reportId, results);
    return { error: null };
  }

  const { valid, skipped } = prepareMarkersForInsert(results);
  if (valid.length === 0) {
    return {
      error:
        skipped.length > 0
          ? "No valid marker results to save. Check marker names and numeric values."
          : null,
    };
  }

  const supabase = tryCreateClient()!;
  const { data: report, error: reportError } = await supabase
    .from("bloodwork_reports")
    .select("user_id")
    .eq("id", reportId)
    .maybeSingle();

  if (reportError) return { error: reportError.message };
  if (!report?.user_id) return { error: "Report not found." };

  const rows = valid.map((r) => toBloodworkResultRow(reportId, report.user_id, r));

  const { error } = await supabase.from("bloodwork_results").insert(rows);
  if (error) return { error: formatBloodworkInsertError(error.message) };

  await supabase.from("bloodwork_reports").update({ status: "complete" }).eq("id", reportId);
  return { error: null };
}

export async function updateBloodworkReport(
  reportId: string,
  input: UpdateBloodworkReportInput
): Promise<{ error: string | null }> {
  if (!input.report_name.trim()) {
    return { error: "Report name is required." };
  }
  if (!input.collection_date) {
    return { error: "Collection date is required." };
  }

  if (!isSupabaseEnvConfigured()) {
    return localUpdateReportWithResults(reportId, input);
  }

  const supabase = tryCreateClient()!;

  const { error: reportError } = await supabase
    .from("bloodwork_reports")
    .update({
      report_name: input.report_name.trim(),
      lab_name: input.lab_name?.trim() || null,
      collection_date: input.collection_date,
      notes: input.notes?.trim() || null,
      ...(input.phase !== undefined
        ? { phase: resolveBloodworkPhase(input.phase) }
        : {}),
      status: input.results.length > 0 ? "complete" : undefined,
    })
    .eq("id", reportId);

  if (reportError) return { error: reportError.message };

  const { data: reportOwner, error: ownerError } = await supabase
    .from("bloodwork_reports")
    .select("user_id")
    .eq("id", reportId)
    .maybeSingle();

  if (ownerError) return { error: ownerError.message };
  if (!reportOwner?.user_id) return { error: "Report not found." };

  const deletedIds = input.deleted_result_ids ?? [];
  if (deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("bloodwork_results")
      .delete()
      .in("id", deletedIds)
      .eq("report_id", reportId);

    if (deleteError) return { error: deleteError.message };
  }

  for (const result of input.results) {
    const status =
      result.status !== undefined
        ? result.status
        : calculateStatus(result.result_value, result.reference_low, result.reference_high);

    if (result.id) {
      const { error: updateError } = await supabase
        .from("bloodwork_results")
        .update(bloodworkResultToDbFields({ ...result, status }))
        .eq("id", result.id)
        .eq("report_id", reportId);

      if (updateError) return { error: formatBloodworkInsertError(updateError.message) };
    } else {
      const { valid, skipped } = prepareMarkersForInsert([result]);
      if (valid.length === 0) {
        return {
          error:
            skipped[0]?.reason === "Duplicate marker"
              ? "Duplicate marker — this marker is already on the report."
              : "Could not add marker — name and numeric result are required.",
        };
      }

      const { error: insertError } = await supabase
        .from("bloodwork_results")
        .insert(toBloodworkResultRow(reportId, reportOwner.user_id, valid[0]));

      if (insertError) return { error: formatBloodworkInsertError(insertError.message) };
    }
  }

  return { error: null };
}

export async function deleteReport(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    localDeleteReport(id);
    return { error: null };
  }

  const supabase = tryCreateClient()!;
  const { error } = await supabase.from("bloodwork_reports").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function fetchHistoryForMarker(
  markerName: string,
  range: TrendTimeRange
): Promise<{ data: BloodworkHistoryPoint[]; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localFetchHistoryForMarker(markerName, range), error: null };
  }

  const supabase = tryCreateClient()!;
  let query = supabase
    .from("bloodwork_history")
    .select("*")
    .eq("marker_name", markerName)
    .order("collection_date", { ascending: true });

  if (range !== "all") {
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    query = query.gte("collection_date", from.toISOString().split("T")[0]);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as BloodworkHistoryPoint[], error: null };
}

export async function getSignedFileUrl(
  filePath: string
): Promise<{ url: string | null; error: string | null }> {
  if (filePath.startsWith("http")) {
    return { url: filePath, error: null };
  }
  if (!isSupabaseEnvConfigured()) {
    return { url: null, error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}

export type ExtractMarkersOutcome =
  | { data: BloodworkExtractionResult; error: null; setupRequired: false }
  | { data: null; error: string; setupRequired: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string };

const EXTRACTION_FETCH_TIMEOUT_MS = 65_000;

/** Call server API to extract markers from an uploaded report file (OpenAI vision/OCR). */
export async function extractMarkersFromReport(
  reportId: string
): Promise<ExtractMarkersOutcome> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_FETCH_TIMEOUT_MS);

  try {
    console.log("[bloodwork/client] Requesting extraction...");
    const res = await fetch("/api/bloodwork/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId }),
      signal: controller.signal,
    });
    console.log("[bloodwork/client] Extraction response received", { status: res.status });

    const json = (await res.json()) as {
      success?: boolean;
      code?: string;
      message?: string;
      error?: string;
      markers?: ExtractedBloodworkMarker[];
      structured_markers?: BloodworkExtractionResult["structured_markers"];
      warnings?: string[];
      extractedCount?: number;
      matchedCount?: number;
      saved?: boolean;
      parser?: "pdf" | "openai";
    };

    if (res.status === 503 && json.code === "setup_required") {
      return {
        data: null,
        error: null,
        setupRequired: true,
        setupMessage: json.message ?? "OPENAI_API_KEY is not configured.",
      };
    }

    if (res.status === 504 || json.code === "extraction_timeout") {
      return {
        data: null,
        error:
          json.error ??
          "Extraction timed out after 60 seconds. Try again or enter markers manually.",
        setupRequired: false,
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: json.message ?? json.error ?? "Extraction failed",
        setupRequired: false,
      };
    }

    return {
      data: {
        markers: json.markers ?? [],
        structured_markers: json.structured_markers ?? [],
        warnings: json.warnings ?? [],
        extractedCount: json.extractedCount ?? json.markers?.length ?? 0,
        matchedCount: json.matchedCount ?? 0,
        saved: Boolean(json.saved),
        parser: json.parser ?? "openai",
      },
      error: null,
      setupRequired: false,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        data: null,
        error:
          "Extraction timed out after 65 seconds. The server may still be processing OCR. Try again or enter markers manually.",
        setupRequired: false,
      };
    }

    return {
      data: null,
      error: "Could not reach extraction service. Check your connection and try again.",
      setupRequired: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Check whether server-side extraction is configured (OPENAI_API_KEY). */
export async function fetchExtractionConfig(): Promise<{
  configured: boolean;
  pdfParserAvailable: boolean;
  setupInstructions: string | null;
}> {
  try {
    const res = await fetch("/api/bloodwork/extract");
    if (!res.ok) {
      return { configured: false, pdfParserAvailable: true, setupInstructions: null };
    }
    const json = (await res.json()) as {
      configured?: boolean;
      pdfParserAvailable?: boolean;
      setupInstructions?: string | null;
    };
    return {
      configured: Boolean(json.configured),
      pdfParserAvailable: json.pdfParserAvailable ?? true,
      setupInstructions: json.setupInstructions ?? null,
    };
  } catch {
    return { configured: false, pdfParserAvailable: true, setupInstructions: null };
  }
}
