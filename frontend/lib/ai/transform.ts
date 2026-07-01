import type { Profile } from "@/types/database";
import type { UserCycleWithCompounds } from "@/types/cycles";
import type { BloodworkReportWithResults } from "@/types/bloodwork";
import type { RiskAssessmentResult, RiskHistoryEntry } from "@/types/risk";
import type {
  BloodworkMarkerContext,
  BloodworkReportContext,
  BloodworkTrendPoint,
  CycleContext,
  RiskAssessmentContext,
  UserProfileContext,
} from "@/types/ai";

export function profileToAiContext(profile: Profile | null): UserProfileContext | null {
  if (!profile) return null;
  return {
    age: profile.age,
    sex: profile.sex,
    training_experience: profile.training_experience,
  };
}

export function reportToAiContext(report: BloodworkReportWithResults): BloodworkReportContext {
  return {
    report_id: report.id,
    report_name: report.report_name,
    collection_date: report.collection_date,
    lab_name: report.lab_name,
    markers: report.bloodwork_results.map(
      (r): BloodworkMarkerContext => ({
        marker_name: r.marker_name,
        result_value: Number(r.result_value),
        unit: r.unit,
        reference_low: r.reference_low != null ? Number(r.reference_low) : null,
        reference_high: r.reference_high != null ? Number(r.reference_high) : null,
        status: r.status,
        category: r.category,
      })
    ),
  };
}

export function cycleToAiContext(cycle: UserCycleWithCompounds): CycleContext {
  return {
    cycle_id: cycle.id,
    cycle_name: cycle.cycle_name,
    goal: cycle.goal,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
    compounds: cycle.cycle_compounds
      .filter((cc) => cc.compound)
      .map((cc) => ({
        name: cc.compound!.name,
        weekly_dose: Number(cc.weekly_dose),
        unit: cc.unit,
        duration_weeks: cc.duration_weeks,
        category: cc.compound!.category?.name ?? null,
      })),
  };
}

export function riskToAiContext(assessment: RiskAssessmentResult): RiskAssessmentContext {
  return {
    overall_score: assessment.overall_score,
    overall_level: assessment.overall_level,
    summary: assessment.summary,
    categories: assessment.categories.map((c) => ({
      category_name: c.category_name,
      score: c.score,
      level: c.level,
      triggered_rule_count: c.triggered_rules.length,
    })),
  };
}

export function historyToTrendPoints(
  history: { marker_name: string; collection_date: string; result_value: number; unit: string; status?: string | null }[]
): BloodworkTrendPoint[] {
  return history.map((h) => ({
    marker_name: h.marker_name,
    collection_date: h.collection_date,
    result_value: Number(h.result_value),
    unit: h.unit,
    status: h.status,
  }));
}

export function riskHistoryToContext(history: RiskHistoryEntry[]): Record<string, unknown>[] {
  return history.map((h) => ({
    assessment_type: h.assessment_type,
    overall_score: h.overall_score,
    created_at: h.created_at,
    cycle_id: h.cycle_id,
  }));
}
