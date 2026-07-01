import type { BloodworkStatus } from "@/types/bloodwork";

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
