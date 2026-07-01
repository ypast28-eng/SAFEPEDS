/** Knowledge Base types — mirrors backend API */

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type KnowledgeSort = "newest" | "popular" | "updated";

export interface KnowledgeCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface KnowledgeReference {
  id: string;
  title: string;
  authors?: string | null;
  journal?: string | null;
  publication_year?: number | null;
  doi?: string | null;
  url?: string | null;
}

export interface RelatedCompound {
  id: string;
  name: string;
  compound_type?: string | null;
}

export interface RelatedBloodMarker {
  id: string;
  name: string;
  category?: string | null;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  difficulty_level: DifficultyLevel;
  view_count: number;
  published: boolean;
  image_url?: string | null;
  category: KnowledgeCategory;
  created_at: string;
  updated_at: string;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  references: KnowledgeReference[];
  related_compounds: RelatedCompound[];
  related_blood_markers: RelatedBloodMarker[];
  related_articles: ArticleSummary[];
}

export interface KnowledgeSearchParams {
  q?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  compound?: string;
  blood_marker?: string;
  peptide?: string;
  sarm?: string;
  sort?: KnowledgeSort;
  limit?: number;
  offset?: number;
}

export interface KnowledgeSearchResult {
  articles: ArticleSummary[];
  total: number;
  query?: string | null;
}

export interface FeaturedArticles {
  newest: ArticleSummary[];
  popular: ArticleSummary[];
  recently_updated: ArticleSummary[];
}

export interface ArticleCreateInput {
  title: string;
  slug: string;
  category_id: string;
  summary?: string;
  content?: string;
  difficulty_level?: DifficultyLevel;
  image_url?: string | null;
  published?: boolean;
}

export interface ArticleUpdateInput {
  title?: string;
  slug?: string;
  category_id?: string;
  summary?: string;
  content?: string;
  difficulty_level?: DifficultyLevel;
  image_url?: string | null;
  published?: boolean;
}

export interface ReferenceCreateInput {
  article_id: string;
  title: string;
  authors?: string;
  journal?: string;
  publication_year?: number;
  doi?: string;
  url?: string;
}

export interface LinkCompoundInput {
  compound_id: string;
  article_id: string;
}

export interface LinkBloodMarkerInput {
  blood_marker_id: string;
  article_id: string;
}

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner: "text-primary",
  intermediate: "text-secondary",
  advanced: "text-accent",
};
