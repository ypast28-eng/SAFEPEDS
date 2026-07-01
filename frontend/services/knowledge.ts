import { config } from "@/lib/config";
import { isBackendConfigured } from "@/lib/runtime/config";
import { MOCK_KB_CATEGORIES, mockKbArticleBySlug, mockKbSearch } from "@/lib/mock/knowledge";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";
import type {
  ArticleCreateInput,
  ArticleDetail,
  ArticleSummary,
  ArticleUpdateInput,
  FeaturedArticles,
  KnowledgeCategory,
  KnowledgeReference,
  KnowledgeSearchParams,
  KnowledgeSearchResult,
  LinkBloodMarkerInput,
  LinkCompoundInput,
  ReferenceCreateInput,
} from "@/types/knowledge";

const BASE = `${config.api.baseUrl}/api/v1/knowledge`;

function buildSearchUrl(params: KnowledgeSearchParams): string {
  const url = new URL(`${BASE}/search`);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.difficulty) url.searchParams.set("difficulty", params.difficulty);
  if (params.compound) url.searchParams.set("compound", params.compound);
  if (params.blood_marker) url.searchParams.set("blood_marker", params.blood_marker);
  if (params.peptide) url.searchParams.set("peptide", params.peptide);
  if (params.sarm) url.searchParams.set("sarm", params.sarm);
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.offset) url.searchParams.set("offset", String(params.offset));
  return url.toString();
}

export async function fetchKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  if (!isBackendConfigured()) return MOCK_KB_CATEGORIES;
  try {
    const response = await fetch(`${BASE}/categories`);
    if (!response.ok) return MOCK_KB_CATEGORIES;
    return response.json() as Promise<KnowledgeCategory[]>;
  } catch {
    return MOCK_KB_CATEGORIES;
  }
}

export async function searchKnowledgeArticles(
  params: KnowledgeSearchParams
): Promise<KnowledgeSearchResult> {
  if (!isBackendConfigured()) {
    const { articles, total } = mockKbSearch(params.q, params.category);
    return { articles, total };
  }
  try {
    const response = await fetch(buildSearchUrl(params));
    if (!response.ok) throw new Error("Search failed");
    return response.json() as Promise<KnowledgeSearchResult>;
  } catch {
    const { articles, total } = mockKbSearch(params.q, params.category);
    return { articles, total };
  }
}

export async function fetchArticleBySlug(slug: string): Promise<ArticleDetail> {
  if (!isBackendConfigured()) {
    const article = mockKbArticleBySlug(slug);
    if (!article) throw new Error("Article not found");
    return article;
  }
  try {
    const response = await fetch(`${BASE}/articles/${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error("Article not found");
    return response.json() as Promise<ArticleDetail>;
  } catch {
    const article = mockKbArticleBySlug(slug);
    if (!article) throw new Error("Article not found");
    return article;
  }
}

export async function fetchFeaturedArticles(): Promise<FeaturedArticles> {
  if (!isBackendConfigured()) {
    const articles = mockKbSearch().articles;
    return { newest: articles, popular: articles, recently_updated: articles };
  }
  try {
    const response = await fetch(`${BASE}/featured`);
    if (!response.ok) throw new Error("Failed to load featured articles");
    return response.json() as Promise<FeaturedArticles>;
  } catch {
    const articles = mockKbSearch().articles;
    return { newest: articles, popular: articles, recently_updated: articles };
  }
}

// ─── Admin (authenticated) ───────────────────────────────────────────────────

export async function adminListArticles(
  accessToken: string | null | undefined
): Promise<ArticleSummary[]> {
  return authenticatedFetch<ArticleSummary[]>(`${BASE}/admin/articles`, { accessToken });
}

export async function adminCreateArticle(
  body: ArticleCreateInput,
  accessToken: string | null | undefined
): Promise<ArticleSummary> {
  return authenticatedFetch<ArticleSummary>(`${BASE}/admin/articles`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function adminUpdateArticle(
  id: string,
  body: ArticleUpdateInput,
  accessToken: string | null | undefined
): Promise<ArticleSummary> {
  return authenticatedFetch<ArticleSummary>(`${BASE}/admin/articles/${id}`, {
    method: "PATCH",
    body,
    accessToken,
  });
}

export async function adminDeleteArticle(
  id: string,
  accessToken: string | null | undefined
): Promise<void> {
  await authenticatedFetch(`${BASE}/admin/articles/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function adminCreateReference(
  body: ReferenceCreateInput,
  accessToken: string | null | undefined
): Promise<KnowledgeReference> {
  return authenticatedFetch<KnowledgeReference>(`${BASE}/admin/references`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function adminLinkCompound(
  body: LinkCompoundInput,
  accessToken: string | null | undefined
): Promise<void> {
  await authenticatedFetch(`${BASE}/admin/link-compound`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function adminLinkBloodMarker(
  body: LinkBloodMarkerInput,
  accessToken: string | null | undefined
): Promise<void> {
  await authenticatedFetch(`${BASE}/admin/link-blood-marker`, {
    method: "POST",
    body,
    accessToken,
  });
}

export async function uploadKnowledgeImage(
  file: File,
  accessToken: string | null | undefined
): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `articles/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("knowledge-images").upload(path, file);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("knowledge-images").getPublicUrl(path);
  return data.publicUrl;
}
