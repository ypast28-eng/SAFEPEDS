import type { HealthTopicDetail, HealthTopicSummary } from "@/types/health-library";

const TS = "2025-01-01T00:00:00Z";

const TOPICS: HealthTopicDetail[] = [
  {
    id: "ht-hct",
    title: "High Hematocrit",
    slug: "high-hematocrit",
    category: "Blood Health",
    summary: "Educational overview of elevated hematocrit on lab reports.",
    content: "Educational content placeholder for MVP testing.",
    overview: "Hematocrit measures the percentage of blood volume occupied by red blood cells.",
    why_it_matters: "Trends may warrant discussion with a clinician — educational tracking only.",
    view_count: 12,
    published: true,
    image_url: null,
    blood_markers_involved: ["Hematocrit"],
    created_at: TS,
    updated_at: TS,
    support_options: [
      {
        id: "so-1",
        title: "Hydration awareness",
        type: "Lifestyle",
        details: [{ id: "sd-1", description: "General hydration is commonly discussed in athlete health education.", scientific_references: [], notes: "Educational only." }],
      },
      {
        id: "so-2",
        title: "Repeat CBC monitoring",
        type: "Monitoring",
        details: [{ id: "sd-2", description: "Track CBC markers over time on your logging schedule.", scientific_references: [], notes: null }],
      },
    ],
    related_blood_markers: [{ id: "bm-hct", name: "Hematocrit", category: "CBC" }],
    related_compounds: [],
    related_knowledge_articles: [{ id: "ka-hct", title: "Hematocrit Education", slug: "hematocrit-education", summary: "Educational primer" }],
    related_topics: [],
  },
  {
    id: "ht-alt",
    title: "Elevated ALT",
    slug: "elevated-alt",
    category: "Liver",
    summary: "Educational context for ALT above your supplied reference range.",
    content: "Educational placeholder.",
    overview: "ALT is a liver enzyme measured on many metabolic panels.",
    why_it_matters: "Single results should be interpreted in clinical context.",
    view_count: 8,
    published: true,
    image_url: null,
    blood_markers_involved: ["ALT"],
    created_at: TS,
    updated_at: TS,
    support_options: [
      {
        id: "so-3",
        title: "Liver panel trends",
        type: "Monitoring",
        details: [{ id: "sd-3", description: "Log ALT/AST/GGT over time for educational trend review.", scientific_references: [], notes: null }],
      },
    ],
    related_blood_markers: [{ id: "bm-alt", name: "ALT", category: "Liver" }],
    related_compounds: [],
    related_knowledge_articles: [{ id: "ka-liver", title: "Understanding Liver Enzymes", slug: "understanding-liver-enzymes", summary: "Liver enzyme education" }],
    related_topics: [],
  },
  {
    id: "ht-ldl",
    title: "High LDL",
    slug: "high-ldl",
    category: "Cardiovascular",
    summary: "Educational overview of LDL cholesterol findings.",
    content: "Educational placeholder.",
    overview: "LDL is one lipid panel component.",
    why_it_matters: "Cardiovascular risk education is multifactorial.",
    view_count: 5,
    published: true,
    image_url: null,
    blood_markers_involved: ["LDL Cholesterol"],
    created_at: TS,
    updated_at: TS,
    support_options: [],
    related_blood_markers: [{ id: "bm-ldl", name: "LDL Cholesterol", category: "Lipids" }],
    related_compounds: [],
    related_knowledge_articles: [],
    related_topics: [],
  },
];

export function mockHealthSummaries(): HealthTopicSummary[] {
  return TOPICS.map(({ content, overview, why_it_matters, support_options, related_blood_markers, related_compounds, related_knowledge_articles, related_topics, ...rest }) => rest);
}

export function mockHealthTopicBySlug(slug: string): HealthTopicDetail | null {
  const topic = TOPICS.find((t) => t.slug === slug);
  if (!topic) return null;
  const related = mockHealthSummaries().filter((t) => t.category === topic.category && t.slug !== slug).slice(0, 3);
  return { ...topic, related_topics: related };
}

export function mockHealthSearch(params: { q?: string; category?: string; blood_marker?: string }) {
  let list = mockHealthSummaries();
  if (params.category) list = list.filter((t) => t.category === params.category);
  if (params.blood_marker) {
    const m = params.blood_marker.toLowerCase();
    list = list.filter((t) => t.blood_markers_involved.some((b) => b.toLowerCase().includes(m)));
  }
  if (params.q?.trim()) {
    const s = params.q.toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(s) || (t.summary ?? "").toLowerCase().includes(s));
  }
  const categories = [...new Set(mockHealthSummaries().map((t) => t.category))].sort();
  return { topics: list, total: list.length, categories };
}

export function mockHealthTopicsForRisk(slug: string): HealthTopicSummary[] {
  const map: Record<string, string[]> = {
    liver: ["elevated-alt"],
    lipids: ["high-ldl"],
    hematocrit: ["high-hematocrit"],
    cardiovascular: ["high-ldl"],
  };
  const slugs = map[slug] ?? [];
  return mockHealthSummaries().filter((t) => slugs.includes(t.slug));
}
