import type {
  CategoryRiskOutput,
  RiskAssessmentResult,
  RiskEngineInput,
  RiskLevel,
  TriggeredRuleOutput,
} from "@/types/risk";

const CATEGORY_NAMES: Record<string, string> = {
  liver: "Liver",
  kidney: "Kidney",
  cardiovascular: "Cardiovascular",
  blood_pressure: "Blood Pressure",
  lipids: "Lipids",
  hematocrit: "Hematocrit",
  hormonal_suppression: "Hormones",
};

const MVP_CATEGORIES = [
  "liver",
  "kidney",
  "cardiovascular",
  "lipids",
  "blood_pressure",
  "hematocrit",
  "hormonal_suppression",
] as const;

function scoreToLevel(score: number): RiskLevel {
  if (score >= 80) return "Very High";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very Low";
}

function toxicityPoints(value: number | null | undefined, weeklyDose: number): number {
  if (value == null) return 0;
  return Math.min(40, (value / 10) * Math.min(weeklyDose / 200, 1) * 25);
}

function markerBoost(marker: string, status: string | null | undefined, category: string): number {
  if (!status || status === "Normal") return 0;
  const m = marker.toLowerCase();
  const boosts: Record<string, string[]> = {
    liver: ["alt", "ast", "ggt"],
    kidney: ["creatinine", "egfr", "bun"],
    lipids: ["ldl", "triglyceride", "hdl"],
    hematocrit: ["hematocrit", "rbc", "hemoglobin"],
    blood_pressure: ["blood pressure"],
    hormonal_suppression: ["testosterone", "lh", "fsh", "estradiol"],
    cardiovascular: ["ldl", "triglyceride"],
  };
  const keys = boosts[category] ?? [];
  if (keys.some((k) => m.includes(k))) return status === "High" || status === "Low" ? 15 : 0;
  return 0;
}

function buildCategory(
  slug: string,
  score: number,
  rules: TriggeredRuleOutput[]
): CategoryRiskOutput {
  const rounded = Math.round(Math.min(100, score) * 10) / 10;
  return {
    category: slug,
    category_name: CATEGORY_NAMES[slug] ?? slug,
    score: rounded,
    level: scoreToLevel(rounded),
    triggered_rules: rules,
  };
}

/** Client-side placeholder risk engine for MVP when API is unavailable */
export function calculateLocalRisk(input: RiskEngineInput): RiskAssessmentResult {
  const compounds = input.cycle.compounds;
  const scores: Record<string, number> = Object.fromEntries(MVP_CATEGORIES.map((c) => [c, 0]));
  const rules: Record<string, TriggeredRuleOutput[]> = Object.fromEntries(
    MVP_CATEGORIES.map((c) => [c, []])
  );

  if (compounds.length >= 2) {
    for (const slug of MVP_CATEGORIES) {
      scores[slug] += 8;
      rules[slug].push({
        rule_key: "stack_size",
        name: "Multiple compounds",
        weight_applied: 8,
        explanation: "Multiple compounds increase educational monitoring complexity.",
        evidence_placeholder: "MVP placeholder rule",
      });
    }
  }

  for (const c of compounds) {
    const p = c.profile;
    const dose = c.weekly_dose || 0;
    const add = (slug: string, pts: number, name: string) => {
      if (pts <= 0) return;
      scores[slug] += pts;
      rules[slug].push({
        rule_key: `${c.compound_id}-${slug}`,
        name,
        weight_applied: pts,
        explanation: `Educational score contribution from ${c.name} profile (placeholder).`,
        evidence_placeholder: "MVP placeholder",
      });
    };
    add("liver", toxicityPoints(p?.liver_toxicity, dose), "Liver profile");
    add("kidney", toxicityPoints(p?.kidney_toxicity, dose), "Kidney profile");
    add("cardiovascular", toxicityPoints(p?.cardiovascular_toxicity, dose), "Cardiovascular profile");
    add("lipids", toxicityPoints(p?.lipid_impact, dose), "Lipid impact");
    add("blood_pressure", toxicityPoints(p?.blood_pressure_impact, dose), "Blood pressure impact");
    add("hematocrit", toxicityPoints(p?.hematocrit_impact, dose), "Hematocrit impact");
    add(
      "hormonal_suppression",
      toxicityPoints(Math.max(p?.androgenic_activity ?? 0, p?.estrogenic_activity ?? 0), dose),
      "Hormonal activity"
    );
  }

  for (const m of input.bloodwork ?? []) {
    for (const slug of MVP_CATEGORIES) {
      const pts = markerBoost(m.marker_name, m.status, slug);
      if (pts > 0) {
        scores[slug] += pts;
        rules[slug].push({
          rule_key: `marker-${m.marker_name}-${slug}`,
          name: `${m.marker_name} out of range`,
          weight_applied: pts,
          explanation: `Educational placeholder for ${m.marker_name} (${m.status}).`,
          evidence_placeholder: "MVP placeholder",
        });
      }
    }
  }

  const categories = MVP_CATEGORIES.map((slug) => buildCategory(slug, scores[slug], rules[slug]));
  const overall_score =
    Math.round((categories.reduce((s, c) => s + c.score, 0) / categories.length) * 10) / 10;

  return {
    overall_score,
    overall_level: scoreToLevel(overall_score),
    categories,
    summary: `Educational placeholder assessment for "${input.cycle.cycle_name}" with ${compounds.length} compound(s). Rule-based MVP scoring only — not medical advice.`,
    monitoring_recommendations: categories
      .filter((c) => c.level === "Moderate" || c.level === "High" || c.level === "Very High")
      .map((c) => `Consider educational monitoring context for ${c.category_name}.`),
    triggered_rules_count: categories.reduce((n, c) => n + c.triggered_rules.length, 0),
    disclaimer:
      "Educational placeholder risk scores for MVP testing. Not a diagnosis. Consult a qualified healthcare provider.",
  };
}
