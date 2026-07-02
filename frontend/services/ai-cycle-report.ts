import { AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/config";

export type AiReportConfig = {
  configured: boolean;
  setupInstructions: string | null;
};

export async function fetchAiReportConfig(): Promise<AiReportConfig> {
  try {
    const res = await fetch("/api/ai/config", { method: "GET", cache: "no-store" });
    if (!res.ok) {
      return { configured: false, setupInstructions: AI_NOT_CONFIGURED_MESSAGE };
    }
    const json = (await res.json()) as {
      configured?: boolean;
      setupInstructions?: string | null;
    };
    return {
      configured: Boolean(json.configured),
      setupInstructions: json.setupInstructions ?? null,
    };
  } catch {
    return { configured: false, setupInstructions: AI_NOT_CONFIGURED_MESSAGE };
  }
}

export type GenerateCycleReportOutcome =
  | { data: import("@/types/ai").AiCycleReportResult; error: null; setupRequired: false }
  | { data: null; error: string; setupRequired: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string };

export async function generateCycleReportViaApi(
  body: { request: import("@/types/ai").AiCycleReportRequest } | { cycleId: string }
): Promise<GenerateCycleReportOutcome> {
  try {
    const res = await fetch("/api/ai/cycle-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
      code?: string;
      message?: string;
      error?: string;
    } & Partial<import("@/types/ai").AiCycleReportResult>;

    if (res.status === 503 && json.code === "setup_required") {
      return {
        data: null,
        error: null,
        setupRequired: true,
        setupMessage: json.message ?? AI_NOT_CONFIGURED_MESSAGE,
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: json.error ?? json.message ?? "Failed to generate cycle report",
        setupRequired: false,
      };
    }

    return {
      data: json as import("@/types/ai").AiCycleReportResult,
      error: null,
      setupRequired: false,
    };
  } catch {
    return {
      data: null,
      error: "Could not reach AI report service. Check your connection and try again.",
      setupRequired: false,
    };
  }
}
