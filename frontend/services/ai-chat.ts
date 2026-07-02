import { AI_NOT_CONFIGURED_MESSAGE, OPENAI_BILLING_ERROR } from "@/lib/ai/config";
import type { AiChatRequest, AiChatResponse, ChatHistoryMessage } from "@/types/ai";

export type ChatOutcome =
  | { data: AiChatResponse; error: null; setupRequired: false; billingError: false }
  | { data: null; error: string; setupRequired: false; billingError: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string; billingError: false }
  | { data: null; error: null; setupRequired: false; billingError: true; billingMessage: string };

export type ChatHistoryOutcome =
  | { data: ChatHistoryMessage[]; error: null }
  | { data: null; error: string };

function parseErrorResponse(json: {
  code?: string;
  message?: string;
  error?: string;
}): { setupRequired: boolean; billingError: boolean; message: string } {
  if (json.code === "setup_required") {
    return {
      setupRequired: true,
      billingError: false,
      message: json.message ?? AI_NOT_CONFIGURED_MESSAGE,
    };
  }
  if (json.code === "billing_error") {
    return {
      setupRequired: false,
      billingError: true,
      message: json.message ?? OPENAI_BILLING_ERROR,
    };
  }
  return {
    setupRequired: false,
    billingError: false,
    message: json.error ?? json.message ?? "Chat request failed",
  };
}

export async function sendChatMessageViaApi(
  body: Pick<AiChatRequest, "message"> & Partial<Omit<AiChatRequest, "message">>
): Promise<ChatOutcome> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
      code?: string;
      message?: string;
      error?: string;
    } & Partial<AiChatResponse>;

    if (!res.ok) {
      const parsed = parseErrorResponse(json);
      if (parsed.setupRequired) {
        return {
          data: null,
          error: null,
          setupRequired: true,
          setupMessage: parsed.message,
          billingError: false,
        };
      }
      if (parsed.billingError) {
        return {
          data: null,
          error: null,
          setupRequired: false,
          billingError: true,
          billingMessage: parsed.message,
        };
      }
      return {
        data: null,
        error: parsed.message,
        setupRequired: false,
        billingError: false,
      };
    }

    return {
      data: json as AiChatResponse,
      error: null,
      setupRequired: false,
      billingError: false,
    };
  } catch {
    return {
      data: null,
      error: "Could not reach the AI chat service. Check your connection and try again.",
      setupRequired: false,
      billingError: false,
    };
  }
}

export async function fetchChatHistoryViaApi(limit = 20): Promise<ChatHistoryOutcome> {
  try {
    const res = await fetch(`/api/ai/chat?limit=${limit}`, { cache: "no-store" });
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return { data: null, error: json.error ?? "Failed to load chat history" };
    }
    const data = (await res.json()) as ChatHistoryMessage[];
    return { data, error: null };
  } catch {
    return { data: null, error: "Could not load chat history" };
  }
}
