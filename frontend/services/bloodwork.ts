import { createClient } from "@/lib/supabase/client";
import type {
  BloodMarker,
  BloodworkDashboardStats,
  BloodworkHistoryPoint,
  BloodworkReport,
  BloodworkReportWithResults,
  BloodworkResultInput,
  BloodworkStatus,
  CreateReportInput,
  TrendTimeRange,
} from "@/types/bloodwork";

const BUCKET = "bloodwork-reports";

export function calculateStatus(
  value: number,
  refLow: number | null,
  refHigh: number | null
): BloodworkStatus | null {
  if (refLow !== null && value < refLow) return "Low";
  if (refHigh !== null && value > refHigh) return "High";
  if (refLow !== null || refHigh !== null) return "Normal";
  return null;
}

export async function fetchBloodMarkers(): Promise<{
  data: BloodMarker[];
  error: string | null;
}> {
  const supabase = createClient();
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
  const supabase = createClient();
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
    const results = (r.bloodwork_results ?? []) as BloodworkReportWithResults["bloodwork_results"];
    const out_of_range_count = results.filter(
      (res) => res.status === "Low" || res.status === "High"
    ).length;
    return { ...r, bloodwork_results: results, out_of_range_count };
  });

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
  const supabase = createClient();
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
      ...data,
      bloodwork_results: results.sort((a, b) => a.marker_name.localeCompare(b.marker_name)),
      out_of_range_count: results.filter((r) => r.status === "Low" || r.status === "High").length,
    } as BloodworkReportWithResults,
    error: null,
  };
}

export async function createReportWithResults(
  userId: string,
  input: CreateReportInput
): Promise<{ data: BloodworkReport | null; error: string | null }> {
  const supabase = createClient();

  const { data: report, error: reportError } = await supabase
    .from("bloodwork_reports")
    .insert({
      user_id: userId,
      report_name: input.report_name.trim(),
      lab_name: input.lab_name?.trim() || null,
      collection_date: input.collection_date,
      notes: input.notes?.trim() || null,
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
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${reportId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) return { url: null, error: uploadError.message };

  const { error: updateError } = await supabase
    .from("bloodwork_reports")
    .update({ uploaded_file_url: path })
    .eq("id", reportId);

  if (updateError) return { url: null, error: updateError.message };

  return { url: path, error: null };
}

export async function createReportWithFile(
  userId: string,
  input: Omit<CreateReportInput, "results">,
  file: File
): Promise<{ data: BloodworkReport | null; error: string | null }> {
  const { data: report, error } = await createReportWithResults(userId, {
    ...input,
    results: [],
  });
  if (error || !report) return { data: null, error };

  const { error: uploadError } = await uploadReportFile(userId, report.id, file);
  if (uploadError) return { data: report, error: uploadError };

  return { data: report, error: null };
}

export async function appendResultsToReport(
  reportId: string,
  results: BloodworkResultInput[]
): Promise<{ error: string | null }> {
  if (results.length === 0) return { error: null };

  const supabase = createClient();
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
  return { error: error?.message ?? null };
}

export async function deleteReport(id: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from("bloodwork_reports").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function fetchHistoryForMarker(
  markerName: string,
  range: TrendTimeRange
): Promise<{ data: BloodworkHistoryPoint[]; error: string | null }> {
  const supabase = createClient();
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
  const supabase = createClient();
  // If stored as full signed URL, return as-is
  if (filePath.startsWith("http")) {
    return { url: filePath, error: null };
  }
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}
