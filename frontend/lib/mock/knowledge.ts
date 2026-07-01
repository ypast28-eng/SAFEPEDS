import type { ArticleDetail, ArticleSummary, KnowledgeCategory } from "@/types/knowledge";

const TS = "2025-01-01T00:00:00Z";

export const MOCK_KB_CATEGORIES: KnowledgeCategory[] = [
  { id: "kc-liver", name: "Liver Health", slug: "liver-health", description: "Liver enzyme education" },
  { id: "kc-lipids", name: "Lipids", slug: "lipids", description: "Cholesterol education" },
  { id: "kc-blood", name: "Bloodwork", slug: "bloodwork", description: "Lab marker basics" },
];

const ARTICLES: ArticleDetail[] = [
  {
    id: "ka-liver",
    title: "Understanding Liver Enzymes",
    slug: "understanding-liver-enzymes",
    summary: "Educational overview of ALT, AST, and GGT for health monitoring.",
    content: "## Overview\n\nLiver enzymes are commonly measured on blood panels. This article explains what they represent in general educational terms.\n\n## Why monitoring matters\n\nTracking trends over time can help you discuss changes with a qualified clinician.\n\n## Educational note\n\nThis is not medical advice and does not diagnose liver disease.",
    difficulty_level: "beginner",
    published: true,
    view_count: 42,
    image_url: null,
    created_at: TS,
    updated_at: TS,
    category: MOCK_KB_CATEGORIES[0],
    related_compounds: [],
    related_blood_markers: [{ id: "bm-alt", name: "ALT", category: "Liver" }],
    related_articles: [],
    references: [
      { id: "ref-1", title: "Liver function tests — educational reference", authors: "Placeholder" },
    ],
  },
  {
    id: "ka-hdl",
    title: "HDL Cholesterol Monitoring",
    slug: "hdl-cholesterol-monitoring",
    summary: "What HDL represents and why athletes track lipid panels.",
    content: "## Overview\n\nHDL is one component of a lipid panel. Educational context only.\n\n## Monitoring\n\nRepeat panels at intervals you and your clinician agree on.",
    difficulty_level: "beginner",
    published: true,
    view_count: 28,
    image_url: null,
    created_at: TS,
    updated_at: TS,
    category: MOCK_KB_CATEGORIES[1],
    related_compounds: [],
    related_blood_markers: [{ id: "bm-ldl", name: "LDL Cholesterol", category: "Lipids" }],
    related_articles: [],
    references: [],
  },
  {
    id: "ka-hct",
    title: "Hematocrit Education",
    slug: "hematocrit-education",
    summary: "Educational primer on hematocrit and red blood cell fraction.",
    content: "## Overview\n\nHematocrit reflects the proportion of red blood cells in blood.\n\n## Educational context\n\nDiscuss out-of-range values with a qualified provider.",
    difficulty_level: "beginner",
    published: true,
    view_count: 35,
    image_url: null,
    created_at: TS,
    updated_at: TS,
    category: MOCK_KB_CATEGORIES[2],
    related_compounds: [],
    related_blood_markers: [{ id: "bm-hct", name: "Hematocrit", category: "CBC" }],
    related_articles: [],
    references: [],
  },
];

export function mockKbSummaries(): ArticleSummary[] {
  return ARTICLES.map(({ content: _c, references, related_compounds, related_blood_markers, related_articles, ...rest }) => rest);
}

export function mockKbArticleBySlug(slug: string): ArticleDetail | null {
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;
  const related = mockKbSummaries().filter((a) => a.slug !== slug).slice(0, 2);
  return { ...article, related_articles: related };
}

export function mockKbSearch(q?: string, category?: string): { articles: ArticleSummary[]; total: number } {
  let list = mockKbSummaries();
  if (category) {
    list = list.filter(
      (a) => a.category.slug === category || a.category.name.toLowerCase().includes(category.toLowerCase())
    );
  }
  if (q?.trim()) {
    const s = q.toLowerCase();
    list = list.filter(
      (a) => a.title.toLowerCase().includes(s) || (a.summary ?? "").toLowerCase().includes(s)
    );
  }
  return { articles: list, total: list.length };
}
