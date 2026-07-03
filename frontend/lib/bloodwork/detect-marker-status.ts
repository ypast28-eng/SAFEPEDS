import type { BloodworkStatus } from "@/types/bloodwork";

export type ParsedMarkerStatus = "low" | "normal" | "high" | "unknown";

export interface StatusInput {
  numeric_value: number | null;
  comparator: string | null;
  flag: string | null;
  range_low: number | null;
  range_high: number | null;
  reference_range: string;
}

export function detectMarkerStatus(input: StatusInput): ParsedMarkerStatus {
  const flag = input.flag?.toUpperCase();
  if (flag === "L") return "low";
  if (flag === "H") return "high";

  const value = input.numeric_value;
  if (value == null || !Number.isFinite(value)) return "unknown";

  const { range_low, range_high } = input;

  if (range_low != null && range_high != null) {
    if (value < range_low) return "low";
    if (value > range_high) return "high";
    return "normal";
  }

  if (range_high != null && range_low == null) {
    if (value > range_high) return "high";
    return "normal";
  }

  if (range_low != null && range_high == null) {
    if (value < range_low) return "low";
    return "normal";
  }

  const ref = input.reference_range.trim();
  const upperOnly = ref.match(/^<\s*(\d+\.?\d*)$/);
  if (upperOnly) {
    const bound = Number(upperOnly[1]);
    return value > bound ? "high" : "normal";
  }

  const lowerOnly = ref.match(/^>\s*(\d+\.?\d*)$/);
  if (lowerOnly) {
    const bound = Number(lowerOnly[1]);
    return value < bound ? "low" : "normal";
  }

  return "unknown";
}

export function toBloodworkStatus(status: ParsedMarkerStatus): BloodworkStatus | null {
  if (status === "low") return "Low";
  if (status === "high") return "High";
  if (status === "normal") return "Normal";
  return null;
}
