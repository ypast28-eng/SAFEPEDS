import OpenAI from "openai";
import { generateBloodworkReportFallback } from "@/lib/ai/bloodwork-report-fallback";
import { classifyOpenAiError } from "@/lib/ai/openai-errors";
import {
  AI_DISCLAIMER,
  AI_REPORT_MODEL,
  AI_SYSTEM_PROMPT,
  isOpenAiConfigured,
} from "@/lib/ai/openai-config";
import type { AiBloodworkReportRequest, AiBloodworkReportResult } from "@/types/ai";

const BLOODWORK_REPORT_SCHEMA = `{
  "overview": "string — educational summary of the report",
  "normal_markers": ["marker names within reference range"],
  "out_of_range_markers": [
    {
      "marker_name": "string",
      "result_value": 0,
      "unit": "string",
      "status": "Low|High",
      "reference_range": "string or null",
      "educational_note": "string"
    }
  ],
  "historical_comparison": "string — compare to prior results if provided",
  "monitoring_considerations": ["educational monitoring placeholders"]
}`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
  return new OpenAI({ apiKey });
}

function normalizeResult(
  parsed: Partial<AiBloodworkReportResult>,
  fallback: AiBloodworkReportResult
): AiBloodworkReportResult {
  return {
    overview: parsed.overview ?? fallback.overview,
    normal_markers: parsed.normal_markers?.length ? parsed.normal_markers : fallback.normal_markers,
    out_of_range_markers: parsed.out_of_range_markers?.length
      ? parsed.out_of_range_markers
      : fallback.out_of_range_markers,
    historical_comparison: parsed.historical_comparison ?? fallback.historical_comparison,
    monitoring_considerations: parsed.monitoring_considerations?.length
      ? parsed.monitoring_considerations
      : fallback.monitoring_considerations,
    related_articles: parsed.related_articles ?? [],
    scientific_references: parsed.scientific_references ?? [],
    disclaimer: AI_DISCLAIMER,
  };
}

export type GenerateBloodworkReportOutcome =
  | { ok: true; result: AiBloodworkReportResult }
  | { ok: false; code: string; message: string; status: number };

export async function generateBloodworkReportWithAi(
  request: AiBloodworkReportRequest,
  education: {
    healthTopics: { title: string; slug: string; summary: string }[];
    articles: { title: string; slug: string; summary: string }[];
  }
): Promise<GenerateBloodworkReportOutcome> {
  const fallback = generateBloodworkReportFallback(request);

  if (!isOpenAiConfigured()) {
    return { ok: true, result: fallback };
  }

  const markerCount = request.report.markers?.length ?? 0;
  console.info("[bloodwork-report] generating", { markerCount, trendCount: request.historical_trends?.length ?? 0 });

  const userPrompt = `Generate an educational bloodwork report from this structured data.
Do NOT invent content — use Health Library and Knowledge Base sources below.
Do NOT diagnose conditions.

CONTEXT:
${JSON.stringify(request, null, 2)}

HEALTH LIBRARY (PRIMARY — use first):
${JSON.stringify(education.healthTopics, null, 2)}

KNOWLEDGE BASE:
${JSON.stringify(education.articles, null, 2)}

Return JSON matching this schema:
${BLOODWORK_REPORT_SCHEMA}`;

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
    if (!content) {
      console.warn("[bloodwork-report] empty OpenAI response, using fallback");
      return { ok: true, result: fallback };
    }

    const parsed = JSON.parse(content) as Partial<AiBloodworkReportResult>;
    console.info("[bloodwork-report] generated successfully");
    return { ok: true, result: normalizeResult(parsed, fallback) };
  } catch (err) {
    const classified = classifyOpenAiError(err);
    console.error("[bloodwork-report] generation failed", { kind: classified.kind, status: classified.status });
    if (classified.kind !== "unknown") {
      return {
        ok: false,
        code: classified.kind,
        message: classified.message,
        status: classified.status,
      };
    }
    return { ok: true, result: fallback };
  }
}
