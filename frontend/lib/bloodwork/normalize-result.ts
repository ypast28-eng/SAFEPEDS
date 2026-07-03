import type { BloodworkResult, BloodworkStatus } from "@/types/bloodwork";
import { formatRefRange } from "@/utils/bloodwork";

type RawBloodworkResultRow = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeBloodworkResult(row: RawBloodworkResultRow): BloodworkResult {
  const marker = asString(row.marker) ?? asString(row.marker_name) ?? "";
  const panel = asString(row.panel) ?? asString(row.category) ?? "Other";
  const numericValue = asNumber(row.numeric_value) ?? asNumber(row.result_value) ?? 0;
  const rangeLow = asNumber(row.range_low) ?? asNumber(row.reference_low);
  const rangeHigh = asNumber(row.range_high) ?? asNumber(row.reference_high);
  const unit = asString(row.unit) ?? "";
  const resultText =
    asString(row.result) ??
    asString(row.result_text) ??
    (numericValue != null ? String(numericValue) : null);

  return {
    id: String(row.id),
    report_id: String(row.report_id),
    user_id: asString(row.user_id) ?? undefined,
    panel,
    marker,
    result: resultText,
    numeric_value: numericValue,
    comparator: asString(row.comparator),
    flag: asString(row.flag),
    unit,
    reference_range:
      asString(row.reference_range) ??
      (rangeLow != null || rangeHigh != null ? formatRefRange(rangeLow, rangeHigh, unit) : null),
    range_low: rangeLow,
    range_high: rangeHigh,
    status: (row.status as BloodworkStatus | null) ?? null,
    created_at: String(row.created_at ?? ""),
    marker_name: marker,
    category: panel,
    result_value: numericValue,
    result_text: resultText,
    reference_low: rangeLow,
    reference_high: rangeHigh,
  };
}

export function normalizeBloodworkResults(
  rows: Array<RawBloodworkResultRow | BloodworkResult> | null | undefined
): BloodworkResult[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => normalizeBloodworkResult(row as RawBloodworkResultRow));
}
