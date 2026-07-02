import { profileToAiContext, reportToAiContext, cycleToAiContext, riskToAiContext } from "@/lib/ai/transform";
import { calculateRiskAssessment } from "@/lib/risk/engine";
import { fetchEnabledRiskRules } from "@/lib/risk/rules-repository";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import type { createClient } from "@/lib/supabase/server";
import type { BloodworkReportWithResults } from "@/types/bloodwork";
import type { UserCycleWithCompounds } from "@/types/cycles";
import type { Profile } from "@/types/database";
import type { RiskAssessmentResult } from "@/types/risk";
import type {
  AiChatRequest,
  BloodworkTrendPoint,
  CycleContext,
  RiskAssessmentContext,
  UserProfileContext,
  BloodworkReportContext,
} from "@/types/ai";

const CYCLE_COMPOUND_SELECT = `
  *,
  compound:compounds (
    *,
    category:compound_categories (*),
    profile:compound_profiles (*)
  )
`;

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function loadLatestBloodworkReport(
  supabase: ServerSupabase,
  userId: string
): Promise<BloodworkReportWithResults | null> {
  const { data } = await supabase
    .from("bloodwork_reports")
    .select("*, bloodwork_results (*)")
    .eq("user_id", userId)
    .order("collection_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as BloodworkReportWithResults | null) ?? null;
}

async function loadBloodworkTrends(
  supabase: ServerSupabase,
  userId: string,
  limit = 5
): Promise<BloodworkTrendPoint[]> {
  const { data } = await supabase
    .from("bloodwork_reports")
    .select("collection_date, bloodwork_results (*)")
    .eq("user_id", userId)
    .order("collection_date", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  return data.flatMap((report) =>
    (report.bloodwork_results ?? []).map(
      (br: {
        marker_name: string;
        result_value: number | string;
        unit: string;
        status?: string | null;
      }) => ({
        marker_name: br.marker_name,
        collection_date: report.collection_date,
        result_value: Number(br.result_value),
        unit: br.unit,
        status: br.status,
      })
    )
  );
}

async function loadLatestCycle(
  supabase: ServerSupabase,
  userId: string
): Promise<UserCycleWithCompounds | null> {
  const { data, error } = await supabase
    .from("user_cycles")
    .select(`*, cycle_compounds (${CYCLE_COMPOUND_SELECT})`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    cycle_compounds: [...(data.cycle_compounds ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  } as UserCycleWithCompounds;
}

async function loadLatestRiskAssessment(
  supabase: ServerSupabase,
  userId: string
): Promise<RiskAssessmentResult | null> {
  const { data } = await supabase
    .from("risk_assessments")
    .select("output")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const output = data?.output as RiskAssessmentResult | undefined;
  return output?.overall_score != null ? output : null;
}

export interface ChatUserContext {
  profile: UserProfileContext | null;
  report: BloodworkReportContext | null;
  bloodwork_trends: BloodworkTrendPoint[];
  cycle: CycleContext | null;
  risk_assessment: RiskAssessmentContext | null;
}

export async function loadChatUserContext(
  supabase: ServerSupabase,
  userId: string
): Promise<ChatUserContext> {
  const [profileResult, latestReport, bloodworkTrends, latestCycle, savedRisk] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    loadLatestBloodworkReport(supabase, userId),
    loadBloodworkTrends(supabase, userId),
    loadLatestCycle(supabase, userId),
    loadLatestRiskAssessment(supabase, userId),
  ]);

  const profile = profileToAiContext((profileResult.data as Profile | null) ?? null);
  let riskAssessment: RiskAssessmentContext | null = savedRisk ? riskToAiContext(savedRisk) : null;

  if (!riskAssessment && latestCycle) {
    const rules = await fetchEnabledRiskRules();
    const computed = calculateRiskAssessment(
      {
        user_profile: profileToRiskInput((profileResult.data as Profile | null) ?? null),
        cycle: cycleToRiskInput(latestCycle),
        bloodwork: bloodworkToRiskInput(latestReport),
        goal: latestCycle.goal,
      },
      rules
    );
    riskAssessment = riskToAiContext(computed);
  }

  return {
    profile,
    report: latestReport ? reportToAiContext(latestReport) : null,
    bloodwork_trends: bloodworkTrends,
    cycle: latestCycle ? cycleToAiContext(latestCycle) : null,
    risk_assessment: riskAssessment,
  };
}

export function mergeChatRequest(
  body: Partial<AiChatRequest>,
  serverContext: ChatUserContext
): Omit<AiChatRequest, "message"> {
  return {
    context_type: body.context_type ?? "general",
    profile: body.profile ?? serverContext.profile,
    report: body.report ?? serverContext.report,
    cycle: body.cycle ?? serverContext.cycle,
    risk_assessment: body.risk_assessment ?? serverContext.risk_assessment,
    bloodwork_trends: body.bloodwork_trends?.length
      ? body.bloodwork_trends
      : serverContext.bloodwork_trends,
  };
}
