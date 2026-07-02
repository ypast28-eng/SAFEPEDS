import type { RiskLevel } from "@/types/risk";

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very Low";
}

export const RISK_DISCLAIMER =
  "Educational risk scores only. Not medical advice, diagnosis, or safety determination. Consult a qualified healthcare provider.";
