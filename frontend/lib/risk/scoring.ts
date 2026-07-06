import type { RiskLevel } from "@/types/risk";

/** Rule-based risk bands (0–100 cumulative score). */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return "Very High";
  if (score >= 50) return "High";
  if (score >= 25) return "Moderate";
  if (score > 0) return "Low";
  return "Very Low";
}

export const RISK_DISCLAIMER =
  "This is an educational rule-based risk estimate only. It is not medical advice and does not determine safety.";
