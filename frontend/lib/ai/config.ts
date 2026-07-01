import { isAiConfigured } from "@/lib/runtime/config";

export const AI_NOT_CONFIGURED_MESSAGE =
  "AI reports are not configured yet. Connect the FastAPI backend with OPENAI_API_KEY to enable AI features. Educational content is still available in the Knowledge Base and Health Library.";

export function getAiUnavailableMessage(): string | null {
  return isAiConfigured() ? null : AI_NOT_CONFIGURED_MESSAGE;
}
