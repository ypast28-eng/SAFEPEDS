import { AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/config";

export type GenerateBloodworkReportOutcome =
  | { data: import("@/types/ai").AiBloodworkReportResult; error: null; setupRequired: false }
  | { data: null; error: string; setupRequired: false }
  | { data: null; error: null; setupRequired: true; setupMessage: string };

export async function generateBloodworkReportViaApi(
  body: { request: import("@/types/ai").AiBloodworkReportRequest } | { reportId: string }
): Promise<GenerateBloodworkReportOutcome> {
  try {
    const res = await fetch("/api/ai/bloodwork-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let json: {
      code?: string;
      message?: string;
      error?: string;
    } & Partial<import("@/types/ai").AiBloodworkReportResult>;

    try {
      json = (await res.json()) as typeof json;
    } catch {
      return {
        data: null,
        error: `Server returned ${res.status} with a non-JSON response`,
        setupRequired: false,
      };
    }

    if (res.status === 503 && json.error === "OPENAI_API_KEY is missing") {
      return {
        data: null,
        error: null,
        setupRequired: true,
        setupMessage: json.error ?? AI_NOT_CONFIGURED_MESSAGE,
      };
    }

    if (res.status === 503 && json.code === "setup_required") {
      return {
        data: null,
        error: null,
        setupRequired: true,
        setupMessage: json.error ?? json.message ?? AI_NOT_CONFIGURED_MESSAGE,
      };
    }

    if (!res.ok) {
      return {
        data: null,
        error: json.error ?? json.message ?? `Request failed (${res.status})`,
        setupRequired: false,
      };
    }

    return {
      data: json as import("@/types/ai").AiBloodworkReportResult,
      error: null,
      setupRequired: false,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return {
      data: null,
      error: `Could not reach bloodwork report service: ${message}`,
      setupRequired: false,
    };
  }
}
