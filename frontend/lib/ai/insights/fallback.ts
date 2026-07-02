import type { InsightsStructuredContext } from "@/types/ai-insights";
import { analyzeInsightsData, mergeAnalysisIntoDashboard } from "@/lib/ai/insights/analyze";
import { AI_DISCLAIMER } from "@/lib/ai/openai-config";
import type { AiInsightsDashboard } from "@/types/ai-insights";

export function generateInsightsFallback(ctx: InsightsStructuredContext): AiInsightsDashboard {
  const analysis = analyzeInsightsData(ctx);

  const abnormalSummary =
    analysis.abnormal_findings.length > 0
      ? ` ${analysis.abnormal_findings.length} marker(s) outside supplied reference ranges.`
      : "";

  return mergeAnalysisIntoDashboard(
    ctx,
    analysis,
    {
      summary: `Educational intelligence summary across ${ctx.bloodwork_reports.length} bloodwork report(s) and ${analysis.compound_correlations.length} logged compound context(s).${abnormalSummary}`,
      trend_analysis: analysis.trend_timelines
        .map((t) => `${t.marker_name}: ${t.analysis}`)
        .join(" ")
        .slice(0, 500) || "Insufficient multi-test history for detailed trend narrative.",
      long_term_trends: `Analyzed ${ctx.historical_bloodwork.length} historical marker data points across all logged panels.`,
      recommendations: [
        "Repeat key markers on a schedule discussed with your healthcare provider.",
        "Tag bloodwork as cruise (baseline) or blast (cycle) when logging panels for personalized comparisons.",
        "Use educational compound associations as discussion prompts, not diagnoses.",
      ],
    },
    AI_DISCLAIMER
  );
}
