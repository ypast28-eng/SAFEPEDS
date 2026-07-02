import OpenAI from "openai";
import { generateChatFallback } from "@/lib/ai/chat-fallback";
import { classifyOpenAiError } from "@/lib/ai/openai-errors";
import {
  AI_DISCLAIMER,
  AI_REPORT_MODEL,
  AI_SYSTEM_PROMPT,
  isOpenAiConfigured,
} from "@/lib/ai/openai-config";
import type { AiChatRequest, AiChatResponse, AiSourceReference } from "@/types/ai";

const CHAT_SCHEMA = `{
  "reply": "string — educational answer only, using provided context",
  "sources": [{"title": "string", "url": null, "source_type": "article|knowledge_base|scientific"}]
}`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

function normalizeSources(sources: AiSourceReference[] | undefined): AiSourceReference[] {
  return (sources ?? []).slice(0, 6).map((s) => ({
    title: s.title,
    url: s.url ?? null,
    citation_text: s.citation_text ?? null,
    source_type: s.source_type ?? "knowledge_base",
  }));
}

export type GenerateChatOutcome =
  | { ok: true; result: AiChatResponse }
  | { ok: false; code: string; message: string; status: number };

export async function generateChatWithAi(
  userMessage: string,
  context: Omit<AiChatRequest, "message">,
  education: {
    healthTopics: { title: string; slug: string; summary: string; overview?: string | null }[];
    articles: { title: string; slug: string; summary: string }[];
  }
): Promise<GenerateChatOutcome> {
  const fallback = generateChatFallback(userMessage, context, education.articles);

  if (!isOpenAiConfigured()) {
    return { ok: true, result: fallback };
  }

  const userPrompt = `Answer this educational question using ONLY the provided context.
Prioritize Health Library topics. Do NOT invent medical facts or scores.

USER QUESTION:
${userMessage}

STRUCTURED CONTEXT:
${JSON.stringify(context, null, 2)}

HEALTH LIBRARY (PRIMARY):
${JSON.stringify(education.healthTopics, null, 2)}

KNOWLEDGE BASE:
${JSON.stringify(education.articles, null, 2)}

Return JSON matching this schema:
${CHAT_SCHEMA}`;

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
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { ok: true, result: fallback };
    }

    const parsed = JSON.parse(content) as Partial<AiChatResponse>;
    return {
      ok: true,
      result: {
        reply: parsed.reply?.trim() || fallback.reply,
        sources: normalizeSources(parsed.sources?.length ? parsed.sources : fallback.sources),
        disclaimer: AI_DISCLAIMER,
      },
    };
  } catch (err) {
    const classified = classifyOpenAiError(err);
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
