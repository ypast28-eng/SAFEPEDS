import { AI_DISCLAIMER } from "@/lib/ai/openai-config";
import type { AiCycleReportRequest, AiCycleReportResult } from "@/types/ai";

export function generateCycleReportFallback(
  request: AiCycleReportRequest
): AiCycleReportResult {
  const cycle = request.cycle;
  const compounds = cycle.compounds ?? [];
  const risk = request.risk_assessment;

  const compoundLines = compounds.map(
    (c) =>
      `${c.name}: ${c.weekly_dose}${c.unit ?? "mg"}/wk for ${c.duration_weeks ?? 12} weeks`
  );
  const maxWeeks = Math.max(...compounds.map((c) => c.duration_weeks ?? 12), 0);

  const highCats = [...(risk.categories ?? [])]
    .filter((c) => ["Moderate", "High", "Very High"].includes(c.level))
    .sort((a, b) => b.score - a.score);

  const overallSummary = `Educational monitoring priority for "${cycle.cycle_name}" is ${risk.overall_level} (${risk.overall_score}/100) based on rule-based scoring of ${compounds.length} compound(s). This does not determine safety.`;

  const markers: string[] = [];
  for (const c of compounds) {
    const cat = (c.category ?? "").toLowerCase();
    const name = c.name.toLowerCase();
    if (cat.includes("oral") || name.includes("oral")) markers.push("ALT", "AST");
    if (name.includes("testosterone") || cat.includes("androgen")) {
      markers.push("Hematocrit", "HDL", "Total Testosterone", "Estradiol");
    }
    if (cat.includes("19-nor") || name.includes("tren")) markers.push("Prolactin");
  }
  const uniqueMarkers = [...new Set(markers)].slice(0, 8);

  const compoundConcerns = compounds.map((c) => {
    const concerns: string[] = [];
    if ((c.duration_weeks ?? 0) >= 16) {
      concerns.push(`Longer planned duration (${c.duration_weeks} weeks) may increase monitoring relevance.`);
    }
    if ((c.weekly_dose ?? 0) > 0) {
      concerns.push(`Logged dose: ${c.weekly_dose} ${c.unit ?? "mg"}/week — review trends with your clinician.`);
    }
    if (concerns.length === 0) {
      concerns.push("General educational monitoring for this compound category.");
    }
    return { compound_name: c.name, concerns };
  });

  const harmReduction = [
    "Track bloodwork at intervals appropriate to your protocol and discuss results with a qualified provider.",
    "Monitor subjective markers such as sleep, mood, blood pressure, and wellbeing.",
    "Avoid making protocol changes based solely on educational app scores.",
  ];
  if (highCats[0]) {
    harmReduction.unshift(
      `Pay extra attention to educational monitoring context for ${highCats[0].category_name}.`
    );
  }

  const riskExplanation =
    `${overallSummary} ` +
    (highCats.length
      ? `Higher-scoring categories include: ${highCats
          .slice(0, 4)
          .map((c) => `${c.category_name} (${c.level})`)
          .join(", ")}.`
      : "No elevated category scores were triggered by the current rule set.");

  return {
    overall_risk_summary: overallSummary,
    highest_risk_categories: highCats.slice(0, 6).map((c) => ({
      category_name: c.category_name,
      level: c.level,
      score: c.score,
      explanation: `Educational score ${c.score}/100 from rule-based engine.`,
    })),
    compound_concerns: compoundConcerns,
    bloodwork_markers_to_monitor: uniqueMarkers,
    harm_reduction_suggestions: harmReduction,
    compound_summary: compoundLines.length ? compoundLines.join("; ") : "No compounds in this cycle.",
    duration_summary: `Cycle "${cycle.cycle_name}" — longest compound duration: ${maxWeeks} weeks.`,
    risk_explanation: riskExplanation,
    relevant_markers: uniqueMarkers,
    monitoring_priorities: harmReduction,
    related_articles: [],
    scientific_references: [],
    disclaimer: AI_DISCLAIMER,
  };
}
