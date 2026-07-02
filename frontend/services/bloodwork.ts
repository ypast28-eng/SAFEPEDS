import { calculateStatus } from "@/lib/bloodwork/status";
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
} from "@/lib/local-storage/bloodwork";
import type {
  BloodMarker,
  BloodworkDashboardStats,
  BloodworkHistoryPoint,
  BloodworkReport,
  BloodworkReportStatus,
  BloodworkReportWithResults,
  BloodworkResultInput,
  CreateReportInput,
  TrendTimeRange,
} from "@/types/bloodwork";

export { calculateStatus } from "@/lib/bloodwork/status";

const BUCKET = "bloodwork-reports";

function normalizeReport<T extends BloodworkReport & { bloodwork_results?: { length: number } }>(
  row: T
): T {
  const resultsCount = row.bloodwork_results?.length ?? 0;
  return {
    ...row,
    file_name: row.file_name ?? null,
    file_type: row.file_type ?? null,
    status:
      row.status ??
      (resultsCount > 0 ? "complete" : row.uploaded_file_url ? "uploaded" : "uploaded"),
  };
}

function reportInsertPayload(userId: string, input: Omit<CreateReportInput, "results">) {
  return {
    user_id: userId,
    report_name: input.report_name.trim(),
    lab_name: input.lab_name?.trim() || null,
    collection_date: input.collection_date,
    notes: input.notes?.trim() || null,
    file_name: input.file_name ?? null,
    file_type: input.file_type ?? null,
    status: input.status ?? "uploaded",
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
    .order("collection_date", { ascending: false });

  if (error) {
    return {
      data: { totalReports: 0, latestReport: null, previousReports: [], totalOutOfRange: 0 },
      error: error.message,
    };
  }

  const enriched: BloodworkReportWithResults[] = (reports ?? []).map((r) => {
    const row = r as BloodworkReportWithResults & { bloodwork_results?: BloodworkReportWithResults["bloodwork_results"] };
    const results = (row.bloodwork_results ?? []) as BloodworkReportWithResults["bloodwork_results"];
    const out_of_range_count = results.filter(
      (res) => res.status === "Low" || res.status === "High"
    ).length;
    return { ...row, bloodwork_results: results, out_of_range_count };
  }).map((row) => normalizeReport(row));

  const latestReport = enriched[0] ?? null;
  const previousReports = enriched.slice(1);
  const totalOutOfRange = latestReport?.out_of_range_count ?? 0;

  return {
    data: {
      totalReports: enriched.length,
      latestReport,
      previousReports,
      totalOutOfRange,
    },
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

  const results = (data.bloodwork_results ?? []) as BloodworkReportWithResults["bloodwork_results"];
  return {
    data: {
      ...normalizeReport({
        ...data,
        bloodwork_results: results.sort((a, b) => a.marker_name.localeCompare(b.marker_name)),
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
    const rows = input.results.map((r) => ({
      report_id: report.id,
      marker_name: r.marker_name,
      category: r.category,
      result_value: r.result_value,
      unit: r.unit,
      reference_low: r.reference_low,
      reference_high: r.reference_high,
      status: calculateStatus(r.result_value, r.reference_low, r.reference_high),
    }));

    const { error: resultsError } = await supabase.from("bloodwork_results").insert(rows);
    if (resultsError) {
      await supabase.from("bloodwork_reports").delete().eq("id", report.id);
      return { data: null, error: resultsError.message };
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

  const { error: updateError } = await supabase
    .from("bloodwork_reports")
    .update({
      uploaded_file_url: path,
      file_name: file.name,
      file_type: file.type,
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

  return { data: report as BloodworkReport, error: null };
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

  const supabase = tryCreateClient()!;
  const rows = results.map((r) => ({
    report_id: reportId,
    marker_name: r.marker_name,
    category: r.category,
    result_value: r.result_value,
    unit: r.unit,
    reference_low: r.reference_low,
    reference_high: r.reference_high,
    status: calculateStatus(r.result_value, r.reference_low, r.reference_high),
  }));

  const { error } = await supabase.from("bloodwork_results").insert(rows);
  if (error) return { error: error.message };

  await supabase.from("bloodwork_reports").update({ status: "complete" }).eq("id", reportId);
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
