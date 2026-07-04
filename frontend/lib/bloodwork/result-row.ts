import { calculateStatus } from "@/lib/bloodwork/status";
import type { BloodworkResultInput } from "@/types/bloodwork";
import { formatRefRange } from "@/utils/bloodwork";

export interface BloodworkResultDbRow {
  report_id: string;
  user_id: string;
  panel: string;
  marker: string;
  result: string | null;
  numeric_value: number;
  comparator: string | null;
  flag: string | null;
  unit: string;
  reference_range: string | null;
  range_low: number | null;
  range_high: number | null;
  status: import("@/types/bloodwork").BloodworkStatus | null;
  marker_name: string;
  category: string;
  result_value: number;
  reference_low: number | null;
  reference_high: number | null;
  result_text: string | null;
}

/** Fields written to public.bloodwork_results (structured + legacy NOT NULL columns). */
export function bloodworkResultToDbFields(
  result: BloodworkResultInput
): Omit<BloodworkResultDbRow, "report_id" | "user_id"> {
  const displayResult =
    result.result?.trim() ||
    result.result_text?.trim() ||
    (result.result_value != null ? String(result.result_value) : "");

  let numericValue = result.numeric_value ?? result.result_value;
  if (!Number.isFinite(numericValue)) {
    const parsed = displayResult.match(/^([<>]=?)\s*(\d+\.?\d*)/);
    if (parsed) {
      numericValue = Number(parsed[2]);
    }
  }

  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid numeric result for marker "${result.marker_name ?? result.marker ?? "unknown"}"`);
  }

  const rangeLow = result.range_low ?? result.reference_low;
  const rangeHigh = result.range_high ?? result.reference_high;
  const panel = result.panel?.trim() || result.category?.trim() || "Other";
  const markerName = result.marker?.trim() || result.marker_name?.trim() || "";
  if (!markerName) {
    throw new Error("marker_name is required");
  }

  const unit = result.unit?.trim() ?? "";
  const status =
    result.status !== undefined
      ? result.status
      : calculateStatus(numericValue, rangeLow, rangeHigh);

  return {
    panel,
    marker: markerName,
    result: displayResult || null,
    numeric_value: numericValue,
    comparator: result.comparator?.trim() ?? null,
    flag: result.flag?.trim() ?? null,
    unit,
    reference_range:
      result.reference_range?.trim() ||
      (rangeLow != null || rangeHigh != null
        ? formatRefRange(rangeLow, rangeHigh, unit)
        : null),
    range_low: rangeLow,
    range_high: rangeHigh,
    status,
    marker_name: markerName,
    category: panel,
    result_value: numericValue,
    reference_low: rangeLow,
    reference_high: rangeHigh,
    result_text: displayResult || null,
  };
}

export function toBloodworkResultRow(
  reportId: string,
  userId: string,
  result: BloodworkResultInput
): BloodworkResultDbRow {
  return {
    report_id: reportId,
    user_id: userId,
    ...bloodworkResultToDbFields(result),
  };
}

export function toBloodworkResultRows(
  reportId: string,
  userId: string,
  results: BloodworkResultInput[]
): BloodworkResultDbRow[] {
  return results.map((result) => toBloodworkResultRow(reportId, userId, result));
}
