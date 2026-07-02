import OpenAI from "openai";
import { generateChatReplyFallback } from "@/lib/ai/chat-fallback";
import {
  AI_DISCLAIMER,
  AI_REPORT_MODEL,
  AI_SYSTEM_PROMPT,
  isOpenAiConfigured,
  OPENAI_AI_SETUP_INSTRUCTIONS,
  OPENAI_BILLING_ERROR,
} from "@/lib/ai/openai-config";
import type { AiChatRequest, AiChatResponse } from "@/types/ai";

const CHAT_SCHEMA = `{
  "reply": "string — educational answer only"
}`;

const BLOCKED_REPLY =
  "I can only provide general educational information about your logged data. " +
  "I cannot provide individualized medical advice, prescribe compounds, " +
  "diagnose conditions, or assess whether a cycle is safe. " +
  "Please ask an educational question about your markers, trends, or risk scores.";

export type ChatGenerateError = {
  code: "setup_required" | "billing_error" | "rate_limit";
  message: string;
  status: number;
};

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

export function classifyOpenAiError(err: unknown): ChatGenerateError | null {
  if (!(err instanceof OpenAI.APIError)) return null;

  if (err.status === 401) {
    return {
      code: "setup_required",
      message: OPENAI_AI_SETUP_INSTRUCTIONS,
      status: 503,
    };
  }

  const errorCode =
    typeof err.error === "object" && err.error !== null && "code" in err.error
      ? String((err.error as { code?: string }).code ?? "")
      : "";

  if (err.status === 429) {
    if (errorCode === "insufficient_quota" || /quota|billing/i.test(err.message)) {
      return {
        code: "billing_error",
        message: OPENAI_BILLING_ERROR,
        status: 402,
      };
    }
    return {
      code: "rate_limit",
      message: "OpenAI rate limit reached. Please wait a moment and try again.",
      status: 429,
    };
  }

  if (/insufficient_quota|billing|payment/i.test(err.message)) {
    return {
      code: "billing_error",
      message: OPENAI_BILLING_ERROR,
      status: 402,
    };
  }

  return null;
}

function buildChatPrompt(userMessage: string, context: Omit<AiChatRequest, "message">): string {
  return `Answer this educational question using ONLY the provided context.
Do NOT invent educational content. Explain bloodwork, cycles, and pre-computed risk scores only.
Never diagnose, prescribe, or say a cycle is safe or unsafe.

USER QUESTION:
${userMessage}

STRUCTURED CONTEXT:
${JSON.stringify(context, null, 2)}

Return JSON matching this schema:
${CHAT_SCHEMA}`;
}

export async function generateChatReply(
  userMessage: string,
  context: Omit<AiChatRequest, "message">,
  options?: { blockReason?: string | null }
): Promise<AiChatResponse> {
  if (options?.blockReason) {
    return {
      reply: BLOCKED_REPLY,
      sources: [],
      disclaimer: AI_DISCLAIMER,
    };
  }

  const fallback = generateChatReplyFallback(userMessage, context as Record<string, unknown>);

  if (!isOpenAiConfigured()) {
    return fallback;
  }

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: AI_REPORT_MODEL,
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: buildChatPrompt(userMessage, context) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as { reply?: string };
    const reply = parsed.reply?.trim();
    if (!reply) return fallback;

    return {
      reply,
      sources: [],
      disclaimer: AI_DISCLAIMER,
    };
  } catch (err) {
    const classified = classifyOpenAiError(err);
    if (classified) {
      throw classified;
    }
    return fallback;
  }
}
