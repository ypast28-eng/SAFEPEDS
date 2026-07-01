import { config } from "@/lib/config";
import { isBackendConfigured } from "@/lib/runtime/config";
import {
  mockHealthSearch,
  mockHealthTopicBySlug,
  mockHealthTopicsForRisk,
} from "@/lib/mock/health-library";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type {
  HealthTopicDetail,
  HealthTopicSearchResult,
  HealthTopicSummary,
} from "@/types/health-library";

const BASE = `${config.api.baseUrl}/api/v1/health-library`;

export async function fetchHealthCategories(): Promise<string[]> {
  if (!isBackendConfigured()) return mockHealthSearch({}).categories;
  try {
    const res = await fetch(`${BASE}/categories`);
    if (!res.ok) return mockHealthSearch({}).categories;
    return res.json() as Promise<string[]>;
  } catch {
    return mockHealthSearch({}).categories;
  }
}

export async function searchHealthTopics(params: {
  q?: string;
  category?: string;
  blood_marker?: string;
  limit?: number;
}): Promise<HealthTopicSearchResult> {
  if (!isBackendConfigured()) return mockHealthSearch(params);
  try {
    const url = new URL(`${BASE}/search`);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "") url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Search failed");
    return res.json() as Promise<HealthTopicSearchResult>;
  } catch {
    return mockHealthSearch(params);
  }
}

export async function fetchHealthTopic(slug: string): Promise<HealthTopicDetail> {
  if (!isBackendConfigured()) {
    const topic = mockHealthTopicBySlug(slug);
    if (!topic) throw new Error("Topic not found");
    return topic;
  }
  try {
    const res = await fetch(`${BASE}/topics/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Topic not found");
    return res.json() as Promise<HealthTopicDetail>;
  } catch {
    const topic = mockHealthTopicBySlug(slug);
    if (!topic) throw new Error("Topic not found");
    return topic;
  }
}

export async function fetchTopicsForRiskCategory(
  riskSlug: string
): Promise<HealthTopicSummary[]> {
  if (!isBackendConfigured()) return mockHealthTopicsForRisk(riskSlug);
  try {
    const res = await fetch(`${BASE}/risk/${encodeURIComponent(riskSlug)}/topics`);
    if (!res.ok) return mockHealthTopicsForRisk(riskSlug);
    return res.json() as Promise<HealthTopicSummary[]>;
  } catch {
    return mockHealthTopicsForRisk(riskSlug);
  }
}

export async function fetchBookmarks(
  accessToken: string | null | undefined
): Promise<HealthTopicSummary[]> {
  return authenticatedFetch<HealthTopicSummary[]>(`${BASE}/bookmarks`, { accessToken });
}

export async function toggleBookmark(
  topicId: string,
  accessToken: string | null | undefined
): Promise<{ bookmarked: boolean }> {
  return authenticatedFetch<{ bookmarked: boolean }>(`${BASE}/bookmarks/${topicId}`, {
    method: "POST",
    accessToken,
  });
}

export async function fetchRecentTopics(
  accessToken: string | null | undefined,
  limit = 10
): Promise<HealthTopicSummary[]> {
  return authenticatedFetch<HealthTopicSummary[]>(`${BASE}/recent?limit=${limit}`, {
    accessToken,
  });
}

export async function recordTopicView(
  topicId: string,
  accessToken: string | null | undefined
): Promise<void> {
  await authenticatedFetch(`${BASE}/views/${topicId}`, {
    method: "POST",
    accessToken,
  });
}

// Admin
export async function adminListHealthTopics(
  accessToken: string | null | undefined
): Promise<HealthTopicSummary[]> {
  return authenticatedFetch<HealthTopicSummary[]>(`${BASE}/admin/topics`, { accessToken });
}

export async function adminCreateHealthTopic(
  body: Record<string, unknown>,
  accessToken: string | null | undefined
): Promise<HealthTopicSummary> {
  return authenticatedFetch<HealthTopicSummary>(`${BASE}/admin/topics`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function adminUpdateHealthTopic(
  id: string,
  body: Record<string, unknown>,
  accessToken: string | null | undefined
): Promise<HealthTopicSummary> {
  return authenticatedFetch<HealthTopicSummary>(`${BASE}/admin/topics/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export async function adminDeleteHealthTopic(
  id: string,
  accessToken: string | null | undefined
): Promise<void> {
  await authenticatedFetch(`${BASE}/admin/topics/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
