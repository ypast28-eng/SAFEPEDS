import { OPENAI_AI_SETUP_INSTRUCTIONS } from "@/lib/ai/openai-config";

export const AI_NOT_CONFIGURED_MESSAGE = OPENAI_AI_SETUP_INSTRUCTIONS;

/** @deprecated Use fetchAiReportConfig() — checks Next.js OpenAI API, not FastAPI */
export function getAiUnavailableMessage(): string | null {
  return null;
}
