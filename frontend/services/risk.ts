import { config } from "@/lib/config";
import type {
  CompareCyclesResult,
  RiskAssessmentResult,
  RiskCompareInput,
  RiskEngineInput,
  RiskHistoryEntry,
  WhatIfInput,
  WhatIfResult,
} from "@/types/risk";

const BASE = `${config.api.baseUrl}/api/v1/risk`;

async function post<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Risk API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Risk API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function calculateRisk(
  input: RiskEngineInput,
  userId?: string,
  save = true
): Promise<RiskAssessmentResult> {
  const params: Record<string, string> = { save: String(save) };
  if (userId) params.user_id = userId;
  return post<RiskAssessmentResult>("/calculate", input, params);
}

export async function compareCycles(
  input: RiskCompareInput,
  userId?: string,
  save = true
): Promise<CompareCyclesResult> {
  const params: Record<string, string> = { save: String(save) };
  if (userId) params.user_id = userId;
  return post<CompareCyclesResult>("/compare", input, params);
}

export async function whatIfAnalysis(
  input: WhatIfInput,
  userId?: string,
  save = true
): Promise<WhatIfResult> {
  const params: Record<string, string> = { save: String(save) };
  if (userId) params.user_id = userId;
  return post<WhatIfResult>("/what-if", input, params);
}

export async function fetchRiskHistory(
  userId: string,
  limit = 20
): Promise<RiskHistoryEntry[]> {
  return get<RiskHistoryEntry[]>(`/history/${userId}?limit=${limit}`);
}
