import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type {
  AiBloodworkReportRequest,
  AiBloodworkReportResult,
  AiChatRequest,
  AiChatResponse,
  AiCycleReportRequest,
  AiCycleReportResult,
  AiInsightsRequest,
  AiInsightsResult,
  AiTimelineRequest,
  AiTimelineResult,
  ChatHistoryMessage,
} from "@/types/ai";

const BASE = "/api/v1/ai";

export async function generateBloodworkReport(
  body: AiBloodworkReportRequest,
  accessToken: string | null | undefined
): Promise<AiBloodworkReportResult> {
  return authenticatedFetch<AiBloodworkReportResult>(`${BASE}/bloodwork-report`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function generateCycleReport(
  body: AiCycleReportRequest,
  accessToken: string | null | undefined
): Promise<AiCycleReportResult> {
  return authenticatedFetch<AiCycleReportResult>(`${BASE}/cycle-report`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function generateTimeline(
  body: AiTimelineRequest,
  accessToken: string | null | undefined
): Promise<AiTimelineResult> {
  return authenticatedFetch<AiTimelineResult>(`${BASE}/timeline`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function generateInsights(
  body: AiInsightsRequest,
  accessToken: string | null | undefined
): Promise<AiInsightsResult> {
  return authenticatedFetch<AiInsightsResult>(`${BASE}/insights`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function sendChatMessage(
  body: AiChatRequest,
  _accessToken?: string | null | undefined
): Promise<AiChatResponse> {
  const { sendChatMessageViaApi } = await import("@/services/ai-chat");
  const outcome = await sendChatMessageViaApi(body);
  if (outcome.setupRequired) {
    throw new Error(outcome.setupMessage);
  }
  if (outcome.billingError) {
    throw new Error(outcome.billingMessage);
  }
  if (outcome.error || !outcome.data) {
    throw new Error(outcome.error ?? "Chat failed");
  }
  return outcome.data;
}

export async function fetchChatHistory(
  _accessToken?: string | null | undefined,
  limit = 20
): Promise<ChatHistoryMessage[]> {
  const { fetchChatHistoryViaApi } = await import("@/services/ai-chat");
  const outcome = await fetchChatHistoryViaApi(limit);
  if (outcome.error) return [];
  return outcome.data ?? [];
}
