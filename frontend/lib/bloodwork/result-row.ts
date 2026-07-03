import { calculateStatus } from "@/lib/bloodwork/status";
import type { BloodworkResultInput } from "@/types/bloodwork";

export function toBloodworkResultRow(reportId: string, result: BloodworkResultInput) {
  const status =
    result.status !== undefined
      ? result.status
      : calculateStatus(result.result_value, result.reference_low, result.reference_high);

  return {
    report_id: reportId,
    marker_name: result.marker_name,
    category: result.category,
    result_value: result.result_value,
    unit: result.unit,
    reference_low: result.reference_low,
    reference_high: result.reference_high,
    status,
    result_text: result.result_text ?? null,
    comparator: result.comparator ?? null,
    flag: result.flag ?? null,
    reference_range: result.reference_range ?? null,
  };
}
