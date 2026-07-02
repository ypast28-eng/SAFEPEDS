import { AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/config";
import type { AiInsightsDashboard } from "@/types/ai-insights";

export type GenerateInsightsOutcome =
  | { data: AiInsightsDashboard; error: null; setupRequired: false; noBloodwork: false }
  | { data: AiInsightsDashboard; error: null; setupRequired: true; setupMessage: string; noBloodwork: false }
  | { data: null; error: string; setupRequired: false; noBloodwork: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string; noBloodwork: false }
  | { data: null; error: string; setupRequired: false; noBloodwork: true };

const MAX_RETRIES = 2;

async function fetchOnce(): Promise<Response> {
  return fetch("/api/ai/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
}

export async function generateInsightsViaApi(): Promise<GenerateInsightsOutcome> {
  let lastNetworkError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchOnce();

      let json: {
      code?: string;
      error?: string;
      message?: string;
      setup_error?: string;
      openai_configured?: boolean;
    } & Partial<AiInsightsDashboard>;
      try {
        json = (await res.json()) as typeof json;
      } catch {
        console.error("[insights-client] non-JSON response", res.status);
        return {
          data: null,
          error: `Server returned ${res.status} with an invalid response.`,
          setupRequired: false,
          noBloodwork: false,
        };
      }

      if (res.status === 503 && json.error === "OPENAI_API_KEY is missing") {
        console.error("[insights-client] OPENAI_API_KEY missing");
        return {
          data: null,
          error: null,
          setupRequired: true,
          setupMessage: json.error ?? AI_NOT_CONFIGURED_MESSAGE,
          noBloodwork: false,
        };
      }

      if (res.ok && json.setup_error === "OPENAI_API_KEY is missing") {
        console.warn("[insights-client] deterministic mode — OPENAI_API_KEY missing");
        const { setup_error: _s, openai_configured: _o, ...dashboard } = json;
        return {
          data: dashboard as AiInsightsDashboard,
          error: null,
          setupRequired: true,
          setupMessage:
            "OPENAI_API_KEY is missing. Showing rule-based analysis; add your API key for AI narrative enhancement.",
          noBloodwork: false,
        };
      }

      if (res.status === 400 && json.error === "no_bloodwork") {
        return {
          data: null,
          error: json.message ?? "No bloodwork available.",
          setupRequired: false,
          noBloodwork: true,
        };
      }

      if (!res.ok) {
        console.error("[insights-client] API error", res.status, json.error ?? json.message);
        return {
          data: null,
          error: json.error ?? json.message ?? `Unable to generate AI report (${res.status}).`,
          setupRequired: false,
          noBloodwork: false,
        };
      }

      return {
        data: json as AiInsightsDashboard,
        error: null,
        setupRequired: false,
        noBloodwork: false,
      };
    } catch (err) {
      lastNetworkError = err instanceof Error ? err.message : "Network error";
      console.error("[insights-client] network error attempt", attempt + 1, lastNetworkError);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
    }
  }

  return {
    data: null,
    error: `Unable to generate AI report. Please try again. (${lastNetworkError ?? "network error"})`,
    setupRequired: false,
    noBloodwork: false,
  };
}
