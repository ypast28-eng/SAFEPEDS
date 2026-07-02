import OpenAI from "openai";
import { generateCycleReportFallback } from "@/lib/ai/cycle-report-fallback";
import {
  AI_DISCLAIMER,
  AI_REPORT_MODEL,
  AI_SYSTEM_PROMPT,
  isOpenAiConfigured,
} from "@/lib/ai/openai-config";
import type { AiCycleReportRequest, AiCycleReportResult } from "@/types/ai";

const CYCLE_REPORT_SCHEMA = `{
  "overall_risk_summary": "string — educational summary of pre-computed overall risk",
  "highest_risk_categories": [
    {"category_name": "string", "level": "string", "score": 0, "explanation": "string"}
  ],
  "compound_concerns": [
    {"compound_name": "string", "concerns": ["educational concern strings"]}
  ],
  "bloodwork_markers_to_monitor": ["marker names"],
  "harm_reduction_suggestions": ["educational harm-reduction style suggestions"],
  "compound_summary": "string",
  "duration_summary": "string",
  "risk_explanation": "string — explain pre-computed scores only"
}`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

function normalizeResult(
  parsed: Partial<AiCycleReportResult>,
  fallback: AiCycleReportResult
): AiCycleReportResult {
  return {
    overall_risk_summary: parsed.overall_risk_summary ?? fallback.overall_risk_summary,
    highest_risk_categories:
      parsed.highest_risk_categories?.length
        ? parsed.highest_risk_categories
        : fallback.highest_risk_categories,
    compound_concerns:
      parsed.compound_concerns?.length ? parsed.compound_concerns : fallback.compound_concerns,
    bloodwork_markers_to_monitor:
      parsed.bloodwork_markers_to_monitor?.length
        ? parsed.bloodwork_markers_to_monitor
        : fallback.bloodwork_markers_to_monitor,
    harm_reduction_suggestions:
      parsed.harm_reduction_suggestions?.length
        ? parsed.harm_reduction_suggestions
        : fallback.harm_reduction_suggestions,
    compound_summary: parsed.compound_summary ?? fallback.compound_summary,
    duration_summary: parsed.duration_summary ?? fallback.duration_summary,
    risk_explanation: parsed.risk_explanation ?? fallback.risk_explanation,
    relevant_markers:
      parsed.bloodwork_markers_to_monitor?.length
        ? parsed.bloodwork_markers_to_monitor
        : parsed.relevant_markers?.length
          ? parsed.relevant_markers
          : fallback.relevant_markers,
    monitoring_priorities:
      parsed.harm_reduction_suggestions?.length
        ? parsed.harm_reduction_suggestions
        : parsed.monitoring_priorities?.length
          ? parsed.monitoring_priorities
          : fallback.monitoring_priorities,
    related_articles: parsed.related_articles ?? [],
    scientific_references: parsed.scientific_references ?? [],
    disclaimer: AI_DISCLAIMER,
  };
}

export async function generateCycleReportWithAi(
  request: AiCycleReportRequest
): Promise<AiCycleReportResult> {
  const fallback = generateCycleReportFallback(request);

  if (!isOpenAiConfigured()) {
    return fallback;
  }

  const userPrompt = `Generate an educational cycle report from this structured data.
Explain PRE-COMPUTED risk scores only. Include harm-reduction style educational suggestions.
Do NOT invent compounds or scores not in the context.

CONTEXT:
${JSON.stringify(request, null, 2)}

Return JSON matching this schema:
${CYCLE_REPORT_SCHEMA}`;

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
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as Partial<AiCycleReportResult>;
    return normalizeResult(parsed, fallback);
  } catch {
    return fallback;
  }
}
