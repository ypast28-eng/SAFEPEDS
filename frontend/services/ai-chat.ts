import { AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/config";
import type { AiChatResponse, ChatHistoryMessage } from "@/types/ai";

export type SendChatOutcome =
  | { data: AiChatResponse; error: null; setupRequired: false; billingError: false }
  | { data: null; error: string; setupRequired: false; billingError: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string; billingError: false }
  | { data: null; error: null; setupRequired: false; billingError: true; billingMessage: string };

export async function clearChatHistoryViaApi(): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/ai/chat/history", {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      return { error: json.error ?? "Failed to clear chat" };
    }
    return { error: null };
  } catch {
    return { error: "Could not reach the AI chat service. Check your connection and try again." };
  }
}

export async function fetchChatHistoryViaApi(_limit = 30): Promise<ChatHistoryMessage[]> {
  return [];
}

export async function sendChatMessageViaApi(body: {
  message: string;
  cycleId?: string | null;
  context_type?: "bloodwork" | "cycle" | "risk" | "general";
}): Promise<SendChatOutcome> {
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

    if (res.status === 503 && json.code === "setup_required") {
      return {
        data: null,
        error: null,
        setupRequired: true,
        setupMessage: json.message ?? AI_NOT_CONFIGURED_MESSAGE,
        billingError: false,
      };
    }

    if (res.status === 503 && json.code === "billing_error") {
      return {
        data: null,
        error: null,
        setupRequired: false,
        billingError: true,
        billingMessage: json.message ?? "OpenAI billing or quota issue. Check your OpenAI account.",
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: json.error ?? json.message ?? "Could not get a response. Please try again.",
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
