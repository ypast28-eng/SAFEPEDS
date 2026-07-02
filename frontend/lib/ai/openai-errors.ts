import OpenAI from "openai";
import {
  OPENAI_AI_BILLING_INSTRUCTIONS,
  OPENAI_AI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/openai-config";

export type OpenAiErrorKind = "setup_required" | "billing_error" | "unknown";

export function classifyOpenAiError(err: unknown): {
  kind: OpenAiErrorKind;
  message: string;
  status: number;
} {
  if (err instanceof OpenAI.APIError) {
    const code = err.code ?? "";
    const lower = `${code} ${err.message}`.toLowerCase();

    if (
      err.status === 401 ||
      err.status === 403 ||
      code === "invalid_api_key" ||
      lower.includes("incorrect api key")
    ) {
      return {
        kind: "setup_required",
        message: OPENAI_AI_SETUP_INSTRUCTIONS,
        status: 503,
      };
    }

    if (
      err.status === 429 ||
      code === "insufficient_quota" ||
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("exceeded your current")
    ) {
      return {
        kind: "billing_error",
        message: OPENAI_AI_BILLING_INSTRUCTIONS,
        status: 503,
      };
    }
  }

  const message = err instanceof Error ? err.message : "Failed to generate AI response";
  return { kind: "unknown", message, status: 500 };
}
