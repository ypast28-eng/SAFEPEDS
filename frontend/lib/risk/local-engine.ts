import { calculateRiskAssessment } from "@/lib/risk/engine";
import { FALLBACK_RISK_RULES } from "@/lib/risk/fallback-rules";
import type { RiskEngineInput } from "@/types/risk";

/** Client-side fallback when no API is reachable */
export function calculateLocalRisk(input: RiskEngineInput) {
  return calculateRiskAssessment(input, FALLBACK_RISK_RULES);
}
