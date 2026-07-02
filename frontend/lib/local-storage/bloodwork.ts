import { calculateStatus } from "@/lib/bloodwork/status";
import { readJson, writeJson } from "@/lib/local-storage/store";
import {
  LS_BLOODWORK_HISTORY_KEY,
  LS_BLOODWORK_KEY,
} from "@/lib/local-storage/keys";
import type {
  BloodworkDashboardStats,
  BloodworkHistoryPoint,
  BloodworkReport,
  BloodworkReportWithResults,
  BloodworkResultInput,
  CreateReportInput,
  TrendTimeRange,
} from "@/types/bloodwork";
import { LOCAL_USER_ID } from "@/lib/runtime/config";

function nowIso() {
  return new Date().toISOString();
}

function loadReports(): BloodworkReportWithResults[] {
  return readJson<BloodworkReportWithResults[]>(LS_BLOODWORK_KEY, []);
}

function saveReports(reports: BloodworkReportWithResults[]) {
  writeJson(
    LS_BLOODWORK_KEY,
    [...reports].sort(
      (a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime()
    )
  );
}

function loadHistory(): BloodworkHistoryPoint[] {
  return readJson<BloodworkHistoryPoint[]>(LS_BLOODWORK_HISTORY_KEY, []);
}

function saveHistory(points: BloodworkHistoryPoint[]) {
  writeJson(LS_BLOODWORK_HISTORY_KEY, points);
}

function enrich(report: BloodworkReportWithResults): BloodworkReportWithResults {
  const out_of_range_count = report.bloodwork_results.filter(
    (r) => r.status === "Low" || r.status === "High"
  ).length;
  return { ...report, out_of_range_count };
}

function appendHistory(report: BloodworkReportWithResults) {
  const history = loadHistory();
  const ts = nowIso();
  for (const r of report.bloodwork_results) {
    history.push({
      id: crypto.randomUUID(),
      user_id: LOCAL_USER_ID,
      marker_name: r.marker_name,
      result_value: Number(r.result_value),
      unit: r.unit,
      collection_date: report.collection_date,
      report_id: report.id,
      created_at: ts,
    });
  }
  saveHistory(history);
}

export function localFetchReportsWithStats(): BloodworkDashboardStats {
  const enriched = loadReports().map(enrich);
  const latestReport = enriched[0] ?? null;
  return {
    totalReports: enriched.length,
    latestReport,
    previousReports: enriched.slice(1),
    totalOutOfRange: latestReport?.out_of_range_count ?? 0,
  };
}

export function localFetchReportById(id: string): BloodworkReportWithResults | null {
  const report = loadReports().find((r) => r.id === id);
  return report ? enrich(report) : null;
}

export function localCreateReportWithResults(
  input: CreateReportInput
): BloodworkReport {
  const ts = nowIso();
  const reportId = crypto.randomUUID();
  const results = input.results.map((r) => ({
    id: crypto.randomUUID(),
    report_id: reportId,
    marker_name: r.marker_name,
    category: r.category,
    result_value: r.result_value,
    unit: r.unit,
    reference_low: r.reference_low,
    reference_high: r.reference_high,
    status: calculateStatus(r.result_value, r.reference_low, r.reference_high),
    created_at: ts,
  }));

  const report: BloodworkReportWithResults = enrich({
    id: reportId,
    user_id: LOCAL_USER_ID,
    report_name: input.report_name.trim(),
    lab_name: input.lab_name?.trim() || null,
    collection_date: input.collection_date,
    file_name: input.file_name ?? null,
    file_type: input.file_type ?? null,
    file_size: null,
    file_path: null,
    file_url: null,
    uploaded_file_url: null,
    status: input.status ?? (input.results.length > 0 ? "complete" : "uploaded"),
    notes: input.notes?.trim() || null,
    created_at: ts,
    updated_at: ts,
    bloodwork_results: results,
  });

  saveReports([report, ...loadReports()]);
  appendHistory(report);
  return report;
}

export function localAppendResultsToReport(
  reportId: string,
  inputs: BloodworkResultInput[]
): void {
  const reports = loadReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx < 0) return;

  const ts = nowIso();
  const newResults = inputs.map((r) => ({
    id: crypto.randomUUID(),
    report_id: reportId,
    marker_name: r.marker_name,
    category: r.category,
    result_value: r.result_value,
    unit: r.unit,
    reference_low: r.reference_low,
    reference_high: r.reference_high,
    status: calculateStatus(r.result_value, r.reference_low, r.reference_high),
    created_at: ts,
  }));

  const updated = enrich({
    ...reports[idx],
    updated_at: ts,
    bloodwork_results: [...reports[idx].bloodwork_results, ...newResults].sort((a, b) =>
      a.marker_name.localeCompare(b.marker_name)
    ),
  });

  reports[idx] = updated;
  saveReports(reports);
  appendHistory(updated);
}

export function localDeleteReport(id: string): void {
  saveReports(loadReports().filter((r) => r.id !== id));
}

export function localUpdateReportWithResults(
  reportId: string,
  input: import("@/types/bloodwork").UpdateBloodworkReportInput
): { error: string | null } {
  const reports = loadReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx < 0) return { error: "Report not found" };

  const ts = nowIso();
  const deleted = new Set(input.deleted_result_ids ?? []);
  const kept = reports[idx].bloodwork_results.filter((r) => !deleted.has(r.id));

  const updatedExisting = kept.map((existing) => {
    const patch = input.results.find((r) => r.id === existing.id);
    if (!patch) return existing;
    const status =
      patch.status !== undefined
        ? patch.status
        : calculateStatus(patch.result_value, patch.reference_low, patch.reference_high);
    return {
      ...existing,
      marker_name: patch.marker_name,
      category: patch.category,
      result_value: patch.result_value,
      unit: patch.unit,
      reference_low: patch.reference_low,
      reference_high: patch.reference_high,
      status,
    };
  });

  const newResults = input.results
    .filter((r) => !r.id)
    .map((r) => ({
      id: crypto.randomUUID(),
      report_id: reportId,
      marker_name: r.marker_name,
      category: r.category,
      result_value: r.result_value,
      unit: r.unit,
      reference_low: r.reference_low,
      reference_high: r.reference_high,
      status:
        r.status !== undefined
          ? r.status
          : calculateStatus(r.result_value, r.reference_low, r.reference_high),
      created_at: ts,
    }));

  const report: BloodworkReportWithResults = enrich({
    ...reports[idx],
    report_name: input.report_name.trim(),
    lab_name: input.lab_name?.trim() || null,
    collection_date: input.collection_date,
    notes: input.notes?.trim() || null,
    updated_at: ts,
    status: input.results.length > 0 || updatedExisting.length > 0 ? "complete" : reports[idx].status,
    bloodwork_results: [...updatedExisting, ...newResults].sort((a, b) =>
      a.marker_name.localeCompare(b.marker_name)
    ),
  });

  reports[idx] = report;
  saveReports(reports);
  return { error: null };
}

export function localFetchHistoryForMarker(
  markerName: string,
  range: TrendTimeRange
): BloodworkHistoryPoint[] {
  let points = loadHistory().filter((p) => p.marker_name === markerName);
  if (range !== "all") {
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    const fromStr = from.toISOString().split("T")[0];
    points = points.filter((p) => p.collection_date >= fromStr);
  }
  return points.sort(
    (a, b) => new Date(a.collection_date).getTime() - new Date(b.collection_date).getTime()
  );
}
