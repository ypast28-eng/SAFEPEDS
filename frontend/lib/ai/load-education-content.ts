import type { SupabaseClient } from "@supabase/supabase-js";

type EducationArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
};

type HealthTopic = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  overview?: string | null;
};

const FALLBACK_ARTICLES: EducationArticle[] = [
  {
    slug: "understanding-liver-enzymes",
    title: "Understanding Liver Enzymes (ALT & AST)",
    category: "bloodwork",
    summary: "Educational overview of hepatic markers.",
  },
  {
    slug: "hdl-cholesterol-monitoring",
    title: "HDL Cholesterol: Why It Is Monitored",
    category: "bloodwork",
    summary: "Educational context on HDL.",
  },
];

function extractKeywords(message: string): string[] {
  const tokens = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  return [...new Set(tokens)].slice(0, 8);
}

export async function loadEducationContent(
  supabase: SupabaseClient,
  message: string,
  markerNames: string[] = []
): Promise<{ healthTopics: HealthTopic[]; articles: EducationArticle[] }> {
  const keywords = [...extractKeywords(message), ...markerNames.map((m) => m.toLowerCase())];
  const search = keywords.slice(0, 4).join(" | ");

  const [topicsResult, articlesResult] = await Promise.all([
    keywords.length
      ? supabase
          .from("health_topics")
          .select("slug, title, category, summary, overview")
          .eq("published", true)
          .or(keywords.map((k) => `title.ilike.%${k}%,summary.ilike.%${k}%`).join(","))
          .limit(6)
      : supabase
          .from("health_topics")
          .select("slug, title, category, summary, overview")
          .eq("published", true)
          .limit(6),
    keywords.length
      ? supabase
          .from("educational_articles")
          .select("slug, title, category, summary")
          .eq("published", true)
          .or(keywords.map((k) => `title.ilike.%${k}%,summary.ilike.%${k}%`).join(","))
          .order("display_order")
          .limit(6)
      : supabase
          .from("educational_articles")
          .select("slug, title, category, summary")
          .eq("published", true)
          .order("display_order")
          .limit(6),
  ]);

  const healthTopics = (topicsResult.data as HealthTopic[] | null) ?? [];
  const articles = (articlesResult.data as EducationArticle[] | null) ?? [];

  if (!healthTopics.length && !articles.length && search) {
    const { data: fallbackTopics } = await supabase
      .from("health_topics")
      .select("slug, title, category, summary, overview")
      .eq("published", true)
      .limit(4);

    const { data: fallbackArticles } = await supabase
      .from("educational_articles")
      .select("slug, title, category, summary")
      .eq("published", true)
      .order("display_order")
      .limit(4);

    return {
      healthTopics: (fallbackTopics as HealthTopic[] | null) ?? [],
      articles: (fallbackArticles as EducationArticle[] | null) ?? FALLBACK_ARTICLES,
    };
  }

  return {
    healthTopics,
    articles: articles.length ? articles : FALLBACK_ARTICLES,
  };
}
