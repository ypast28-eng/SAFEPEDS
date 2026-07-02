import { calculateRiskAssessment } from "@/lib/risk/engine";
import { fetchEnabledRiskRules } from "@/lib/risk/rules-repository";
import { bloodworkToRiskInput, cycleToRiskInput, profileToRiskInput } from "@/lib/risk/transform";
import { pickDefaultCycleId } from "@/lib/risk/compound-insights";
import type { InsightsCycleSummary, InsightsStructuredContext } from "@/types/ai-insights";
import type { BloodworkReportWithResults } from "@/types/bloodwork";
import type { UserCycleWithCompounds } from "@/types/cycles";
import type { Profile } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

const CYCLE_COMPOUND_SELECT = `
  *,
  compound:compounds (
    *,
    category:compound_categories (*),
    profile:compound_profiles (*)
  )
`;

function classifyCycle(cycle: UserCycleWithCompounds): InsightsCycleSummary["classification"] {
  const text = `${cycle.cycle_name} ${cycle.goal ?? ""} ${cycle.notes ?? ""}`.toLowerCase();
  if (/\bcruise\b|\btrt\b|maintenance|low[\s-]?dose/.test(text)) return "cruise";
  if (/\bblast\b|\bbulk\b|heavy[\s-]?stack/.test(text)) return "blast";

  const totalMg = cycle.cycle_compounds.reduce((sum, cc) => sum + Number(cc.weekly_dose), 0);
  if (totalMg > 0 && totalMg <= 250) return "cruise";
  if (totalMg >= 450) return "blast";
  if (totalMg > 0 && totalMg <= 350) return "maintenance";
  return "unknown";
}

function toCycleSummary(cycle: UserCycleWithCompounds): InsightsCycleSummary {
  const compounds = cycle.cycle_compounds
    .filter((cc) => cc.compound)
    .map((cc) => ({
      name: cc.compound!.name,
      weekly_dose: Number(cc.weekly_dose),
      unit: cc.unit,
      duration_weeks: cc.duration_weeks,
      category: cc.compound!.category?.name ?? null,
      administration: cc.compound!.administration ?? null,
      notes: cc.notes,
    }));

  return {
    cycle_id: cycle.id,
    cycle_name: cycle.cycle_name,
    goal: cycle.goal,
    start_date: cycle.start_date,
    end_date: cycle.end_date,
    notes: cycle.notes,
    classification: classifyCycle(cycle),
    total_weekly_mg: compounds.reduce((s, c) => s + c.weekly_dose, 0),
    compounds,
  };
}

function flattenBloodwork(reports: BloodworkReportWithResults[]) {
  return reports.flatMap((report) =>
    report.bloodwork_results.map((r) => ({
      marker_name: r.marker_name,
      result_value: Number(r.result_value),
      unit: r.unit,
      reference_low: r.reference_low != null ? Number(r.reference_low) : null,
      reference_high: r.reference_high != null ? Number(r.reference_high) : null,
      status: r.status,
      category: r.category,
      collection_date: report.collection_date,
      report_id: report.id,
      report_name: report.report_name,
    }))
  );
}

export async function buildInsightsContext(
  supabase: SupabaseClient,
  userId: string
): Promise<InsightsStructuredContext> {
  const [profileResult, reportsResult, cyclesResult, aiReportsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("bloodwork_reports")
      .select("*, bloodwork_results (*)")
      .eq("user_id", userId)
      .order("collection_date", { ascending: false }),
    supabase
      .from("user_cycles")
      .select(`*, cycle_compounds (${CYCLE_COMPOUND_SELECT})`)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("ai_reports")
      .select("report_type, created_at, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = (profileResult.data as Profile | null) ?? null;
  const reports = (reportsResult.data as BloodworkReportWithResults[] | null) ?? [];
  const cyclesRaw = (cyclesResult.data as UserCycleWithCompounds[] | null) ?? [];

  const cycles = cyclesRaw.map((c) => ({
    ...c,
    cycle_compounds: [...(c.cycle_compounds ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  const cycleSummaries = cycles.map(toCycleSummary);
  const defaultCycleId = cycles.length ? pickDefaultCycleId(cycles) : null;
  const currentCycle = cycleSummaries.find((c) => c.cycle_id === defaultCycleId) ?? cycleSummaries[0] ?? null;
  const previousCycles = cycleSummaries.filter((c) => c.cycle_id !== currentCycle?.cycle_id);

  const allPoints = flattenBloodwork(reports);
  const latestReport = reports[0] ?? null;
  const currentBloodwork = latestReport
    ? flattenBloodwork([latestReport])
    : [];

  let riskAssessment: InsightsStructuredContext["risk_assessment"] = null;
  const activeCycle = cycles.find((c) => c.id === currentCycle?.cycle_id);
  if (activeCycle && activeCycle.cycle_compounds.length > 0) {
    const rules = await fetchEnabledRiskRules();
    const assessment = calculateRiskAssessment(
      {
        user_profile: profileToRiskInput(profile),
        cycle: cycleToRiskInput(activeCycle),
        bloodwork: bloodworkToRiskInput(latestReport),
        goal: activeCycle.goal,
      },
      rules
    );
    riskAssessment = {
      overall_score: assessment.overall_score,
      overall_level: assessment.overall_level,
      categories: assessment.categories.map((c) => ({
        category_name: c.category_name,
        score: c.score,
        level: c.level,
      })),
    };
  }

  const previousAiReports = (aiReportsResult.data ?? []).map((row) => {
    const content = row.content as Record<string, unknown> | null;
    const summary =
      (typeof content?.summary === "string" && content.summary) ||
      (typeof content?.overview === "string" && content.overview) ||
      "Previous AI report";
    return {
      report_type: row.report_type as string,
      created_at: row.created_at as string,
      summary,
    };
  });

  console.info("[insights] context built", {
    reports: reports.length,
    cycles: cycleSummaries.length,
    markers: allPoints.length,
  });

  return {
    health_profile: {
      age: profile?.age ?? null,
      sex: profile?.sex ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      body_fat: profile?.body_fat ?? null,
      training_experience: profile?.training_experience ?? null,
    },
    current_bloodwork: currentBloodwork,
    historical_bloodwork: allPoints,
    bloodwork_reports: reports.map((r) => ({
      id: r.id,
      report_name: r.report_name,
      collection_date: r.collection_date,
      lab_name: r.lab_name,
      marker_count: r.bloodwork_results?.length ?? 0,
    })),
    current_cycle: currentCycle,
    previous_cycles: previousCycles,
    risk_assessment: riskAssessment,
    previous_ai_reports: previousAiReports,
  };
}
