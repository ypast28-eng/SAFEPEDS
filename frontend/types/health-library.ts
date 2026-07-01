/** Health Support Library types */

export type SupportOptionType =
  | "Lifestyle"
  | "Monitoring"
  | "Nutrition"
  | "Supplement"
  | "Medication Information"
  | "Educational";

export interface ScientificRef {
  title: string;
  url?: string | null;
  authors?: string | null;
  journal?: string | null;
}

export interface SupportDetail {
  id: string;
  description: string;
  scientific_references: ScientificRef[];
  notes?: string | null;
}

export interface SupportOption {
  id: string;
  title: string;
  type: SupportOptionType;
  details: SupportDetail[];
}

export interface RelatedBloodMarker {
  id: string;
  name: string;
  category?: string | null;
}

export interface RelatedCompound {
  id: string;
  name: string;
  compound_type?: string | null;
}

export interface RelatedKnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
}

export interface HealthTopicSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary?: string | null;
  view_count: number;
  published: boolean;
  image_url?: string | null;
  blood_markers_involved: string[];
  created_at: string;
  updated_at: string;
}

export interface HealthTopicDetail extends HealthTopicSummary {
  content: string;
  overview?: string | null;
  why_it_matters?: string | null;
  support_options: SupportOption[];
  related_blood_markers: RelatedBloodMarker[];
  related_compounds: RelatedCompound[];
  related_knowledge_articles: RelatedKnowledgeArticle[];
  related_topics: HealthTopicSummary[];
}

export interface HealthTopicSearchResult {
  topics: HealthTopicSummary[];
  total: number;
  categories: string[];
}

export const SUPPORT_TYPE_COLORS: Record<SupportOptionType, string> = {
  Lifestyle: "text-primary",
  Monitoring: "text-secondary",
  Nutrition: "text-green-400",
  Supplement: "text-amber-400",
  "Medication Information": "text-muted",
  Educational: "text-foreground",
};

export const HEALTH_CATEGORIES = [
  "Blood Health",
  "Cardiovascular",
  "Liver",
  "Kidney",
  "Hormones",
  "General",
] as const;
