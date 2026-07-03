import type { AiSourceReference } from "@/types/ai";
import type { StructuredBloodworkMarker } from "@/types/bloodwork";

export type HealthScoreLabel = "Excellent" | "Good" | "Fair" | "Needs Attention";
export type RiskLevelLabel = "Low" | "Moderate" | "High";
export type OrganStatus = "Good" | "Monitor" | "Needs Attention" | "Critical";
export type MarkerStatusLabel = "Low" | "Normal" | "High" | "Borderline";
export type TrendLabel =
  | "Stable"
  | "Increasing"
  | "Decreasing"
  | "Rapid Increase"
  | "Rapid Decrease"
  | "Large Increase"
  | "Large Decrease";

export interface InsightsHealthProfile {
  age: number | null;
  sex: string | null;
  height: number | null;
  weight: number | null;
  body_fat: number | null;
  training_experience: string | null;
}

export interface InsightsCycleCompound {
  name: string;
  weekly_dose: number;
  unit: string;
  duration_weeks: number;
  category: string | null;
  administration: string | null;
  notes: string | null;
}

export interface InsightsCycleSummary {
  cycle_id: string;
  cycle_name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  classification: "cruise" | "blast" | "maintenance" | "unknown";
  total_weekly_mg: number;
  compounds: InsightsCycleCompound[];
}

export interface InsightsBloodworkPoint {
  marker_name: string;
  result_value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  status: string | null;
  category: string | null;
  collection_date: string;
  report_id: string;
  report_name: string;
  phase: "cruise" | "blast" | "unknown" | null;
  result_text: string | null;
  reference_range: string | null;
  flag: string | null;
  comparator: string | null;
}

export interface InsightsStructuredContext {
  health_profile: InsightsHealthProfile;
  current_bloodwork: InsightsBloodworkPoint[];
  historical_bloodwork: InsightsBloodworkPoint[];
  bloodwork_reports: Array<{
    id: string;
    report_name: string;
    collection_date: string;
    lab_name: string | null;
    marker_count: number;
    phase: "cruise" | "blast" | "unknown" | null;
    structured_markers?: StructuredBloodworkMarker[] | null;
  }>;
  current_cycle: InsightsCycleSummary | null;
  previous_cycles: InsightsCycleSummary[];
  risk_assessment: {
    overall_score: number;
    overall_level: string;
    categories: Array<{ category_name: string; score: number; level: string }>;
  } | null;
  previous_ai_reports: Array<{ report_type: string; created_at: string; summary: string }>;
}

export interface PriorityFinding {
  title: string;
  severity: "Low" | "Moderate" | "High";
  why_it_matters: string;
  educational_explanation: string;
  monitoring_advice: string;
  marker_name?: string | null;
}

export interface OrganSystemCard {
  system: "cardiovascular" | "blood" | "hormones" | "lipids" | "liver" | "kidney";
  label: string;
  icon: string;
  status: OrganStatus;
  summary: string;
  markers: string[];
}

export interface BiomarkerAnalysis {
  marker_name: string;
  current_value: number;
  unit: string;
  reference_range: string;
  status: MarkerStatusLabel;
  trend: TrendLabel;
  trend_detail: string;
  educational_significance: string;
  possible_ped_associations: string;
  history: Array<{ date: string; value: number; status: string | null }>;
}

export interface MarkerTrendTimeline {
  marker_name: string;
  unit: string;
  points: Array<{ date: string; value: number }>;
  analysis: string;
}

export interface CruiseBlastComparison {
  current_phase: "cruise" | "blast" | "unknown" | null;
  latest_cruise_report: { report_name: string; collection_date: string } | null;
  latest_blast_report: { report_name: string; collection_date: string } | null;
  has_cruise_baseline: boolean;
  markers_outside_clinical_range: Array<{
    marker_name: string;
    value: number;
    unit: string;
    status: string;
  }>;
  markers_changed_from_baseline: Array<{
    marker_name: string;
    baseline_value: number | null;
    current_value: number | null;
    unit: string;
    note: string;
  }>;
  markers_worsened_during_blast: Array<{
    marker_name: string;
    note: string;
  }>;
  markers_improved_since_last_test: Array<{
    marker_name: string;
    note: string;
  }>;
  educational_explanation: string;
  return_to_baseline_note: string;
  cruise_cycle: InsightsCycleSummary | null;
  blast_cycle: InsightsCycleSummary | null;
  cruise_bloodwork: InsightsBloodworkPoint[];
  blast_bloodwork: InsightsBloodworkPoint[];
  marker_differences: Array<{
    marker_name: string;
    cruise_value: number | null;
    blast_value: number | null;
    unit: string;
    note: string;
  }>;
  analysis: string;
}

export interface CompoundCorrelation {
  compound_name: string;
  educational_associations: string[];
  disclaimer: string;
}

export interface AiInsightsDashboard {
  disclaimer: string;
  generated_at: string;
  has_bloodwork: boolean;
  data_summary: {
    bloodwork_report_count: number;
    cycle_count: number;
    marker_data_points: number;
  };
  overall_health_score: number;
  health_score_label: HealthScoreLabel;
  health_score_explanation: string;
  risk_level: RiskLevelLabel;
  risk_explanation: string;
  priority_findings: PriorityFinding[];
  positive_findings: string[];
  organ_systems: OrganSystemCard[];
  biomarker_analyses: BiomarkerAnalysis[];
  trend_timelines: MarkerTrendTimeline[];
  cruise_blast_comparison: CruiseBlastComparison | null;
  compound_correlations: CompoundCorrelation[];
  summary: string;
  abnormal_findings: string[];
  trend_analysis: string;
  long_term_trends: string;
  recommendations: string[];
  related_articles: AiSourceReference[];
  scientific_references: AiSourceReference[];
}
