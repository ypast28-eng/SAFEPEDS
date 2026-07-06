import { calculateRiskAssessment } from "@/lib/risk/engine";
import type { RiskEngineInput } from "@/types/risk";

/** Client-side fallback when no API is reachable */
export function calculateLocalRisk(input: RiskEngineInput) {
  return calculateRiskAssessment(input);
}
