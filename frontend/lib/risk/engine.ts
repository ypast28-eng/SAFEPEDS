import type { RiskAssessmentResult, RiskEngineInput } from "@/types/risk";
import { CATEGORY_DISPLAY_NAMES, MONITORING_PLACEHOLDERS } from "@/lib/risk/category-metadata";
import { evaluateCondition, RuleContext } from "@/lib/risk/rule-context";
import { RISK_DISCLAIMER, scoreToLevel } from "@/lib/risk/scoring";
import type { RiskRuleConfig } from "@/lib/risk/types";

export function calculateRiskAssessment(
  data: RiskEngineInput,
  rules: RiskRuleConfig[]
): RiskAssessmentResult {
  const enabledRules = rules.filter((r) => r.enabled);
  const ctx = new RuleContext(data);
  const categoryScores = new Map<string, number>();
  const categoryRules = new Map<string, RiskAssessmentResult["categories"][0]["triggered_rules"]>();
  let totalTriggered = 0;

  for (const rule of enabledRules) {
    if (!evaluateCondition(rule.condition, ctx)) continue;

    const slug = rule.category_slug;
    categoryScores.set(slug, (categoryScores.get(slug) ?? 0) + rule.weight);
    const triggered = categoryRules.get(slug) ?? [];
    triggered.push({
      rule_key: rule.rule_key,
      name: rule.name,
      weight_applied: rule.weight,
      explanation: rule.explanation,
      evidence_placeholder: rule.evidence_placeholder ?? null,
    });
    categoryRules.set(slug, triggered);
    totalTriggered += 1;
  }

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

  const overall_score =
    categories.length > 0
      ? Math.round((categories.reduce((sum, c) => sum + c.score, 0) / categories.length) * 10) / 10
      : 0;
  const overall_level = scoreToLevel(overall_score);
  const compoundCount = data.cycle.compounds.length;

  return {
    overall_score,
    overall_level,
    categories,
    summary: `Educational assessment for "${data.cycle.cycle_name}" with ${compoundCount} compound(s). Overall monitoring priority: ${overall_level} (${overall_score}/100). ${totalTriggered} rule(s) triggered. Rule-based educational scoring — not a safety determination.`,
    monitoring_recommendations: monitoring.slice(0, 6),
    triggered_rules_count: totalTriggered,
    disclaimer: RISK_DISCLAIMER,
  };
}
