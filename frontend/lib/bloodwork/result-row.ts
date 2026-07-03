import { calculateStatus } from "@/lib/bloodwork/status";
import type { BloodworkResultInput } from "@/types/bloodwork";
import { formatRefRange } from "@/utils/bloodwork";

/** Fields written to public.bloodwork_results (canonical structured schema). */
export function bloodworkResultToDbFields(result: BloodworkResultInput) {
  const numericValue = result.numeric_value ?? result.result_value;
  const rangeLow = result.range_low ?? result.reference_low;
  const rangeHigh = result.range_high ?? result.reference_high;
  const panel = result.panel?.trim() || result.category?.trim() || "Other";
  const marker = result.marker?.trim() || result.marker_name.trim();
  const displayResult =
    result.result?.trim() ||
    result.result_text?.trim() ||
    (numericValue != null ? String(numericValue) : "");
  const status =
    result.status !== undefined
      ? result.status
      : calculateStatus(numericValue, rangeLow, rangeHigh);

  return {
    panel,
    marker,
    result: displayResult || null,
    numeric_value: numericValue,
    comparator: result.comparator ?? null,
    flag: result.flag ?? null,
    unit: result.unit,
    reference_range:
      result.reference_range?.trim() ||
      (rangeLow != null || rangeHigh != null
        ? formatRefRange(rangeLow, rangeHigh, result.unit)
        : null),
    range_low: rangeLow,
    range_high: rangeHigh,
    status,
  };
}

export function toBloodworkResultRow(
  reportId: string,
  userId: string,
  result: BloodworkResultInput
) {
  return {
    report_id: reportId,
    user_id: userId,
    ...bloodworkResultToDbFields(result),
  };
}
