import type { Profile } from "@/types/database";
import type { UserCycleWithCompounds } from "@/types/cycles";
import type {
  BloodworkMarkerInput,
  CycleCompoundInput,
  CycleInput,
  UserProfileInput,
} from "@/types/risk";
import type { BloodworkReportWithResults } from "@/types/bloodwork";

export function profileToRiskInput(profile: Profile | null): UserProfileInput | null {
  if (!profile) return null;
  return {
    age: profile.age,
    sex: profile.sex,
    height: profile.height,
    weight: profile.weight,
    body_fat: profile.body_fat,
    training_experience: profile.training_experience,
  };
}

export function cycleToRiskInput(cycle: UserCycleWithCompounds): CycleInput {
  return {
    cycle_id: cycle.id,
    cycle_name: cycle.cycle_name,
    goal: cycle.goal,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
    compounds: cycle.cycle_compounds
      .filter((cc) => cc.compound)
      .map((cc): CycleCompoundInput => ({
        compound_id: cc.compound_id,
        name: cc.compound!.name,
        category: cc.compound!.category?.name ?? null,
        compound_type: cc.compound!.compound_type,
        administration: cc.compound!.administration,
        weekly_dose: Number(cc.weekly_dose),
        unit: cc.unit,
        frequency_per_week: cc.frequency_per_week,
        duration_weeks: cc.duration_weeks,
        profile: cc.compound!.profile
          ? {
              liver_toxicity: cc.compound!.profile.liver_toxicity,
              kidney_toxicity: cc.compound!.profile.kidney_toxicity,
              cardiovascular_toxicity: cc.compound!.profile.cardiovascular_toxicity,
              lipid_impact: cc.compound!.profile.lipid_impact,
              hematocrit_impact: cc.compound!.profile.hematocrit_impact,
              blood_pressure_impact: cc.compound!.profile.blood_pressure_impact,
              estrogenic_activity: cc.compound!.profile.estrogenic_activity,
              androgenic_activity: cc.compound!.profile.androgenic_activity,
              prolactin_activity: cc.compound!.profile.prolactin_activity,
            }
          : null,
      })),
  };
}

export function bloodworkToRiskInput(
  report: BloodworkReportWithResults | null
): BloodworkMarkerInput[] {
  if (!report) return [];
  return report.bloodwork_results.map((r) => ({
    marker_name: r.marker_name,
    result_value: Number(r.result_value),
    unit: r.unit,
    status: r.status,
    collection_date: report.collection_date,
  }));
}

export function buildCycleInputFromDraft(
  base: CycleInput,
  compounds: CycleCompoundInput[]
): CycleInput {
  return {
    ...base,
    cycle_name: `${base.cycle_name} (What-If)`,
    compounds,
  };
}
