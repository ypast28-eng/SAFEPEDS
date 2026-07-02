import { config } from "@/lib/config";
import { isBackendConfigured } from "@/lib/runtime/config";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { calculateLocalRisk } from "@/lib/risk/local-engine";
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

export type RiskAssessmentResultWithSource = RiskAssessmentResult & {
  rules_source?: "supabase" | "fallback" | "fastapi";
};

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

async function calculateViaNextApi(
  input: RiskEngineInput,
  userId?: string,
  save = true
): Promise<RiskAssessmentResultWithSource | null> {
  try {
    const res = await fetch("/api/risk/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, userId, save }),
    });
    if (!res.ok) return null;
    return (await res.json()) as RiskAssessmentResultWithSource;
  } catch {
    return null;
  }
}

export async function calculateRisk(
  input: RiskEngineInput,
  userId?: string,
  save = true
): Promise<RiskAssessmentResultWithSource> {
  if (isSupabaseEnvConfigured()) {
    const nextResult = await calculateViaNextApi(input, userId, save);
    if (nextResult) return nextResult;
  }

  if (isBackendConfigured()) {
    try {
      const params: Record<string, string> = { save: String(save) };
      if (userId) params.user_id = userId;
      const result = await post<RiskAssessmentResult>("/calculate", input, params);
      return { ...result, rules_source: "fastapi" };
    } catch {
      // fall through to local engine
    }
  }

  return { ...calculateLocalRisk(input), rules_source: "fallback" };
}

export async function compareCycles(
  input: RiskCompareInput,
  userId?: string,
  save = true
): Promise<CompareCyclesResult> {
  if (!isBackendConfigured()) {
    const a = calculateLocalRisk({
      user_profile: input.user_profile,
      cycle: input.cycle_a,
      bloodwork: input.bloodwork,
    });
    const b = calculateLocalRisk({
      user_profile: input.user_profile,
      cycle: input.cycle_b,
      bloodwork: input.bloodwork,
    });
    return {
      cycle_a_name: input.cycle_a.cycle_name,
      cycle_b_name: input.cycle_b.cycle_name,
      assessment_a: a,
      assessment_b: b,
      category_comparisons: a.categories.map((cat, i) => ({
        category: cat.category,
        category_name: cat.category_name,
        score_a: cat.score,
        level_a: cat.level,
        score_b: b.categories[i]?.score ?? 0,
        level_b: b.categories[i]?.level ?? "Very Low",
        score_delta: cat.score - (b.categories[i]?.score ?? 0),
      })),
      compound_differences: [],
      duration_differences: [],
      monitoring_considerations: a.monitoring_recommendations,
      disclaimer: a.disclaimer,
    };
  }
  const params: Record<string, string> = { save: String(save) };
  if (userId) params.user_id = userId;
  return post<CompareCyclesResult>("/compare", input, params);
}

export async function whatIfAnalysis(
  input: WhatIfInput,
  userId?: string,
  save = true
): Promise<WhatIfResult> {
  if (!isBackendConfigured()) {
    const baseline = calculateLocalRisk({
      user_profile: input.user_profile,
      cycle: input.base_cycle,
      bloodwork: input.bloodwork,
    });
    const modified = calculateLocalRisk({
      user_profile: input.user_profile,
      cycle: input.modified_cycle,
      bloodwork: input.bloodwork,
    });
    return {
      base_assessment: baseline,
      modified_assessment: modified,
      category_comparisons: baseline.categories.map((cat, i) => ({
        category: cat.category,
        category_name: cat.category_name,
        score_a: cat.score,
        level_a: cat.level,
        score_b: modified.categories[i]?.score ?? 0,
        level_b: modified.categories[i]?.level ?? "Very Low",
        score_delta: (modified.categories[i]?.score ?? 0) - cat.score,
      })),
      summary: "Educational what-if comparison using saved cycle data.",
      disclaimer: modified.disclaimer,
    };
  }
  const params: Record<string, string> = { save: String(save) };
  if (userId) params.user_id = userId;
  return post<WhatIfResult>("/what-if", input, params);
}

export async function fetchRiskHistory(
  userId: string,
  limit = 20
): Promise<RiskHistoryEntry[]> {
  if (isBackendConfigured()) {
    try {
      return await get<RiskHistoryEntry[]>(`/history/${userId}?limit=${limit}`);
    } catch {
      // try Supabase below
    }
  }

  if (!isSupabaseEnvConfigured()) return [];

  try {
    const res = await fetch(`/api/risk/history?limit=${limit}`);
    if (!res.ok) return [];
    return (await res.json()) as RiskHistoryEntry[];
  } catch {
    return [];
  }
}
