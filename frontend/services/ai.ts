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
  accessToken: string | null | undefined
): Promise<AiChatResponse> {
  return authenticatedFetch<AiChatResponse>(`${BASE}/chat`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function fetchChatHistory(
  accessToken: string | null | undefined,
  limit = 20
): Promise<ChatHistoryMessage[]> {
  return authenticatedFetch<ChatHistoryMessage[]>(`${BASE}/chat/history?limit=${limit}`, {
    accessToken,
  });
}
