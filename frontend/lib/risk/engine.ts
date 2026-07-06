import type { RiskAssessmentResult, RiskEngineInput } from "@/types/risk";
import { CATEGORY_DISPLAY_NAMES, MONITORING_PLACEHOLDERS } from "@/lib/risk/category-metadata";
import { calculateCycleRisk } from "@/lib/risk/cycle-risk-engine";
import { RISK_DISCLAIMER, scoreToLevel } from "@/lib/risk/scoring";

const TAG_TO_CATEGORY: Record<string, string> = {
  cardiovascular: "cardiovascular",
  neuropsychiatric: "mental_wellbeing",
  lipids: "lipids",
  "blood pressure": "blood_pressure",
  sleep: "sleep",
  prolactin: "prolactin",
  estrogen: "estrogen",
  hematocrit: "hematocrit",
  rbc: "hematocrit",
  acne: "mental_wellbeing",
  "hair loss": "fertility",
  androgenic: "fertility",
  prostate: "fertility",
  "sexual side effects": "prolactin",
  liver: "liver",
  glucose: "cardiovascular",
  "insulin resistance": "cardiovascular",
  edema: "blood_pressure",
  "carpal tunnel": "injection_burden",
};

function buildCategoryScores(cycleRisk: ReturnType<typeof calculateCycleRisk>) {
  const categoryScores = new Map<string, number>();
  const categoryRules = new Map<string, RiskAssessmentResult["categories"][0]["triggered_rules"]>();

  for (const compound of cycleRisk.compound_risks) {
    const perTag =
      compound.risk_tags.length > 0 ? compound.score / compound.risk_tags.length : 0;
    for (const tag of compound.risk_tags) {
      const slug = TAG_TO_CATEGORY[tag.toLowerCase()] ?? tag.toLowerCase().replace(/\s+/g, "_");
      categoryScores.set(slug, (categoryScores.get(slug) ?? 0) + perTag);
      const triggered = categoryRules.get(slug) ?? [];
      triggered.push({
        rule_key: `${compound.compound_id}:${tag}`,
        name: compound.compound_name,
        weight_applied: Math.round(perTag * 10) / 10,
        explanation: compound.reasons[0] ?? `${compound.compound_name} risk`,
        evidence_placeholder: null,
      });
      categoryRules.set(slug, triggered);
    }
  }

  for (const reason of cycleRisk.synergy_reasons) {
    const slug = "overall_monitoring_priority";
    categoryScores.set(slug, (categoryScores.get(slug) ?? 0) + 8);
    const triggered = categoryRules.get(slug) ?? [];
    triggered.push({
      rule_key: `synergy:${triggered.length}`,
      name: "Stack synergy",
      weight_applied: 8,
      explanation: reason,
      evidence_placeholder: null,
    });
    categoryRules.set(slug, triggered);
  }

  return { categoryScores, categoryRules };
}

export function calculateRiskAssessment(data: RiskEngineInput): RiskAssessmentResult {
  const cycleRisk = calculateCycleRisk(data);
  const { categoryScores, categoryRules } = buildCategoryScores(cycleRisk);

  const allSlugs = new Set([
    ...Object.keys(CATEGORY_DISPLAY_NAMES),
    ...categoryScores.keys(),
  ]);

  const categories = [...allSlugs]
    .sort((a, b) =>
      (CATEGORY_DISPLAY_NAMES[a] ?? a).localeCompare(CATEGORY_DISPLAY_NAMES[b] ?? b)
    )
    .map((slug) => {
      const rawScore = Math.min(100, categoryScores.get(slug) ?? 0);
      const rounded = Math.round(rawScore * 10) / 10;
      return {
        category: slug,
        category_name: CATEGORY_DISPLAY_NAMES[slug] ?? slug.replace(/_/g, " "),
        score: rounded,
        level: scoreToLevel(rounded),
        triggered_rules: categoryRules.get(slug) ?? [],
      };
    });

  const monitoring: string[] = [];
  for (const cat of categories) {
    if (
      (cat.level === "Moderate" || cat.level === "High" || cat.level === "Very High") &&
      MONITORING_PLACEHOLDERS[cat.category]
    ) {
      monitoring.push(MONITORING_PLACEHOLDERS[cat.category]);
    }
  }

  for (const compound of cycleRisk.compound_risks) {
    for (const marker of compound.monitoring_markers) {
      if (!monitoring.includes(marker)) {
        monitoring.push(marker);
      }
    }
  }

  const compoundCount = data.cycle.compounds.length;
  const synergySummary =
    cycleRisk.synergy_reasons.length > 0
      ? ` Synergy factors: ${cycleRisk.synergy_reasons.join("; ")}.`
      : "";

  return {
    overall_score: cycleRisk.overall_score,
    overall_level: cycleRisk.overall_level,
    categories,
    compound_risks: cycleRisk.compound_risks,
    synergy_reasons: cycleRisk.synergy_reasons,
    total_anabolic_mg_per_week: cycleRisk.total_anabolic_mg_per_week,
    duration_weeks: cycleRisk.duration_weeks,
    summary: `Educational assessment for "${data.cycle.cycle_name}" with ${compoundCount} compound(s), ${cycleRisk.duration_weeks} week duration, and ${cycleRisk.total_anabolic_mg_per_week} mg/week total anabolic load. Overall risk: ${cycleRisk.overall_level} (${cycleRisk.overall_score}/100).${synergySummary}`,
    monitoring_recommendations: monitoring.slice(0, 8),
    triggered_rules_count:
      categories.reduce((sum, c) => sum + c.triggered_rules.length, 0) +
      cycleRisk.synergy_reasons.length,
    disclaimer: RISK_DISCLAIMER,
  };
}
