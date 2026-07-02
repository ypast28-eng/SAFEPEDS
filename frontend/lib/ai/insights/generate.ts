import OpenAI from "openai";
import { analyzeInsightsData, mergeAnalysisIntoDashboard } from "@/lib/ai/insights/analyze";
import { generateInsightsFallback } from "@/lib/ai/insights/fallback";
import { classifyOpenAiError } from "@/lib/ai/openai-errors";
import {
  AI_DISCLAIMER,
  AI_REPORT_MODEL,
  AI_SYSTEM_PROMPT,
  isOpenAiConfigured,
} from "@/lib/ai/openai-config";
import type { AiInsightsDashboard, InsightsStructuredContext } from "@/types/ai-insights";
import type { AiSourceReference } from "@/types/ai";

const NARRATIVE_SCHEMA = `{
  "summary": "string — professional educational executive summary",
  "trend_analysis": "string — bloodwork trend narrative",
  "long_term_trends": "string — multi-panel longitudinal observations",
  "recommendations": ["harm-reduction style educational recommendations"],
  "related_articles": [{"title": "", "url": null, "source_type": "knowledge_base"}],
  "scientific_references": [{"title": "", "url": null, "source_type": "scientific"}]
}`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey });
}

export type GenerateInsightsOutcome =
  | { ok: true; dashboard: AiInsightsDashboard }
  | { ok: false; code: string; message: string; status: number };

export async function generateInsightsWithAi(
  ctx: InsightsStructuredContext,
  education: {
    healthTopics: { title: string; slug: string; summary: string }[];
    articles: { title: string; slug: string; summary: string }[];
  }
): Promise<GenerateInsightsOutcome> {
  const analysis = analyzeInsightsData(ctx);
  const fallbackDashboard = generateInsightsFallback(ctx);

  if (!isOpenAiConfigured()) {
    return { ok: true, dashboard: fallbackDashboard };
  }

  const structuredPayload = {
    health_profile: ctx.health_profile,
    precomputed_analysis: {
      health_score: analysis.health_score,
      risk_level: analysis.risk_level,
      priority_findings: analysis.priority_findings,
      positive_findings: analysis.positive_findings,
      organ_systems: analysis.organ_systems,
      biomarker_analyses: analysis.biomarker_analyses.slice(0, 25),
      cruise_blast_comparison: analysis.cruise_blast_comparison,
      compound_correlations: analysis.compound_correlations,
    },
    bloodwork_reports: ctx.bloodwork_reports,
    current_cycle: ctx.current_cycle,
    previous_cycles: ctx.previous_cycles,
    risk_assessment: ctx.risk_assessment,
    previous_ai_reports: ctx.previous_ai_reports,
  };

  console.info("[insights] calling OpenAI", {
    reports: ctx.bloodwork_reports.length,
    markers: analysis.biomarker_analyses.length,
  });

  const userPrompt = `Generate educational narrative sections for a premium health intelligence dashboard.
Use ONLY the structured JSON below. Do NOT diagnose. Do NOT prescribe.
Explain possible PED associations as educational possibilities, not causation.

STRUCTURED DATA:
${JSON.stringify(structuredPayload, null, 2)}

HEALTH LIBRARY:
${JSON.stringify(education.healthTopics, null, 2)}

KNOWLEDGE BASE:
${JSON.stringify(education.articles, null, 2)}

Return JSON matching:
${NARRATIVE_SCHEMA}`;

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: AI_REPORT_MODEL,
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("[insights] empty OpenAI response, using fallback");
      return { ok: true, dashboard: fallbackDashboard };
    }

    const parsed = JSON.parse(content) as {
      summary?: string;
      trend_analysis?: string;
      long_term_trends?: string;
      recommendations?: string[];
      related_articles?: AiSourceReference[];
      scientific_references?: AiSourceReference[];
    };

    console.info("[insights] OpenAI narrative generated");
    return {
      ok: true,
      dashboard: mergeAnalysisIntoDashboard(
        ctx,
        analysis,
        {
          summary: parsed.summary,
          trend_analysis: parsed.trend_analysis,
          long_term_trends: parsed.long_term_trends,
          recommendations: parsed.recommendations,
          related_articles: parsed.related_articles,
          scientific_references: parsed.scientific_references,
        },
        AI_DISCLAIMER
      ),
    };
  } catch (err) {
    const classified = classifyOpenAiError(err);
    console.error("[insights] OpenAI error", { kind: classified.kind });
    if (classified.kind !== "unknown") {
      return { ok: false, code: classified.kind, message: classified.message, status: classified.status };
    }
    return { ok: true, dashboard: fallbackDashboard };
  }
}
