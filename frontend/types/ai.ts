/** AI Health Intelligence types — mirrors backend API models */

export interface AiSourceReference {
  title: string;
  url?: string | null;
  citation_text?: string | null;
  source_type: "article" | "knowledge_base" | "scientific";
}

export interface UserProfileContext {
  age?: number | null;
  sex?: string | null;
  training_experience?: string | null;
  goal?: string | null;
}

export interface BloodworkMarkerContext {
  marker_name: string;
  result_value: number;
  unit: string;
  reference_low?: number | null;
  reference_high?: number | null;
  status?: "Low" | "Normal" | "High" | null;
  category?: string | null;
}

export interface BloodworkReportContext {
  report_id?: string | null;
  report_name: string;
  collection_date?: string | null;
  lab_name?: string | null;
  markers: BloodworkMarkerContext[];
}

export interface BloodworkTrendPoint {
  marker_name: string;
  collection_date: string;
  result_value: number;
  unit: string;
  status?: string | null;
}

export interface CycleCompoundContext {
  name: string;
  weekly_dose: number;
  unit?: string;
  duration_weeks?: number;
  category?: string | null;
}

export interface CycleContext {
  cycle_id?: string | null;
  cycle_name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  compounds: CycleCompoundContext[];
}

export interface RiskCategoryContext {
  category_name: string;
  score: number;
  level: string;
  triggered_rule_count?: number;
}

export interface RiskAssessmentContext {
  overall_score: number;
  overall_level: string;
  categories: RiskCategoryContext[];
  summary?: string | null;
}

export interface AiBloodworkReportRequest {
  profile?: UserProfileContext | null;
  report: BloodworkReportContext;
  historical_trends?: BloodworkTrendPoint[];
  risk_assessment?: RiskAssessmentContext | null;
}

export interface OutOfRangeMarker {
  marker_name: string;
  result_value: number;
  unit: string;
  status: string;
  reference_range?: string | null;
  educational_note: string;
}

export interface AiBloodworkReportResult {
  overview: string;
  normal_markers: string[];
  out_of_range_markers: OutOfRangeMarker[];
  historical_comparison: string;
  monitoring_considerations: string[];
  related_articles: AiSourceReference[];
  scientific_references: AiSourceReference[];
  disclaimer: string;
}

export interface AiCycleReportRequest {
  profile?: UserProfileContext | null;
  cycle: CycleContext;
  risk_assessment: RiskAssessmentContext;
  bloodwork?: BloodworkMarkerContext[];
}

export interface AiCycleReportResult {
  compound_summary: string;
  duration_summary: string;
  risk_explanation: string;
  relevant_markers: string[];
  monitoring_priorities: string[];
  related_articles: AiSourceReference[];
  scientific_references: AiSourceReference[];
  disclaimer: string;
}

export interface TimelineEvent {
  date: string;
  event_type: string;
  title: string;
  description: string;
}

export interface AiTimelineRequest {
  profile?: UserProfileContext | null;
  current_cycle?: CycleContext | null;
  previous_cycles?: CycleContext[];
  bloodwork_reports?: BloodworkReportContext[];
  risk_history?: Record<string, unknown>[];
}

export interface AiTimelineResult {
  events: TimelineEvent[];
  trend_summaries: string[];
  educational_observations: string[];
  related_articles: AiSourceReference[];
  scientific_references: AiSourceReference[];
  disclaimer: string;
}

export interface AiInsightItem {
  title: string;
  description: string;
  marker_name?: string | null;
  trend_direction?: "up" | "down" | "stable" | "unknown" | null;
}

export interface AiInsightsRequest {
  profile?: UserProfileContext | null;
  bloodwork_trends?: BloodworkTrendPoint[];
  risk_history?: Record<string, unknown>[];
}

export interface AiInsightsResult {
  insights: AiInsightItem[];
  related_articles: AiSourceReference[];
  scientific_references: AiSourceReference[];
  disclaimer: string;
}

export interface AiChatRequest {
  message: string;
  context_type?: "bloodwork" | "cycle" | "risk" | "general";
  profile?: UserProfileContext | null;
  report?: BloodworkReportContext | null;
  cycle?: CycleContext | null;
  risk_assessment?: RiskAssessmentContext | null;
  bloodwork_trends?: BloodworkTrendPoint[];
}

export interface AiChatResponse {
  reply: string;
  sources: AiSourceReference[];
  disclaimer: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AiSourceReference[];
  created_at?: string;
}

export const AI_SUGGESTED_QUESTIONS = [
  "What changed since my last blood test?",
  "Explain my HDL trend.",
  "What does elevated ALT measure?",
  "Why is hematocrit monitored?",
  "How are risk scores calculated?",
] as const;
