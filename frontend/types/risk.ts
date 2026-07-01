/** Risk Engine types — mirrors backend API models */

export type RiskLevel = "Very Low" | "Low" | "Moderate" | "High" | "Very High";

export interface UserProfileInput {
  age?: number | null;
  sex?: string | null;
  height?: number | null;
  weight?: number | null;
  body_fat?: number | null;
  training_experience?: string | null;
}

export interface CompoundProfileInput {
  liver_toxicity?: number | null;
  kidney_toxicity?: number | null;
  cardiovascular_toxicity?: number | null;
  lipid_impact?: number | null;
  hematocrit_impact?: number | null;
  blood_pressure_impact?: number | null;
  estrogenic_activity?: number | null;
  androgenic_activity?: number | null;
  prolactin_activity?: number | null;
}

export interface CycleCompoundInput {
  compound_id: string;
  name: string;
  category?: string | null;
  compound_type?: string | null;
  administration?: string | null;
  weekly_dose: number;
  unit?: string;
  frequency_per_week?: number;
  duration_weeks?: number;
  profile?: CompoundProfileInput | null;
}

export interface CycleInput {
  cycle_id?: string | null;
  cycle_name: string;
  goal?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  compounds: CycleCompoundInput[];
}

export interface BloodworkMarkerInput {
  marker_name: string;
  result_value: number;
  unit: string;
  status?: "Low" | "Normal" | "High" | null;
  collection_date?: string | null;
}

export interface RiskEngineInput {
  user_profile?: UserProfileInput | null;
  cycle: CycleInput;
  bloodwork?: BloodworkMarkerInput[];
  goal?: string | null;
}

export interface TriggeredRuleOutput {
  rule_key: string;
  name: string;
  weight_applied: number;
  explanation: string;
  evidence_placeholder?: string | null;
}

export interface CategoryRiskOutput {
  category: string;
  category_name: string;
  score: number;
  level: RiskLevel;
  triggered_rules: TriggeredRuleOutput[];
}

export interface RiskAssessmentResult {
  overall_score: number;
  overall_level: RiskLevel;
  categories: CategoryRiskOutput[];
  summary: string;
  monitoring_recommendations: string[];
  triggered_rules_count: number;
  disclaimer: string;
}

export interface RiskCompareInput {
  user_profile?: UserProfileInput | null;
  cycle_a: CycleInput;
  cycle_b: CycleInput;
  bloodwork?: BloodworkMarkerInput[];
}

export interface CategoryComparisonOutput {
  category: string;
  category_name: string;
  score_a: number;
  level_a: RiskLevel;
  score_b: number;
  level_b: RiskLevel;
  score_delta: number;
}

export interface CompareCyclesResult {
  cycle_a_name: string;
  cycle_b_name: string;
  assessment_a: RiskAssessmentResult;
  assessment_b: RiskAssessmentResult;
  category_comparisons: CategoryComparisonOutput[];
  compound_differences: string[];
  duration_differences: string[];
  monitoring_considerations: string[];
  disclaimer: string;
}

export interface WhatIfInput {
  user_profile?: UserProfileInput | null;
  base_cycle: CycleInput;
  modified_cycle: CycleInput;
  bloodwork?: BloodworkMarkerInput[];
}

export interface WhatIfResult {
  base_assessment: RiskAssessmentResult;
  modified_assessment: RiskAssessmentResult;
  category_comparisons: CategoryComparisonOutput[];
  summary: string;
  disclaimer: string;
}

export interface RiskHistoryEntry {
  id: string;
  cycle_id: string | null;
  assessment_type: string;
  overall_score: number | null;
  created_at: string;
  output?: RiskAssessmentResult;
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  "Very Low": "text-green-400",
  Low: "text-primary",
  Moderate: "text-secondary",
  High: "text-amber-400",
  "Very High": "text-accent",
};

export const RISK_LEVEL_BG: Record<RiskLevel, string> = {
  "Very Low": "bg-green-500/15 border-green-500/30",
  Low: "bg-primary/15 border-primary/30",
  Moderate: "bg-secondary/15 border-secondary/30",
  High: "bg-amber-500/15 border-amber-500/30",
  "Very High": "bg-accent/15 border-accent/30",
};
