import { calculateRiskAssessment } from "@/lib/risk/engine";
import { fetchEnabledRiskRules } from "@/lib/risk/rules-repository";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import {
  cycleToAiContext,
  profileToAiContext,
  reportToAiContext,
  riskToAiContext,
} from "@/lib/ai/transform";
import { pickDefaultCycleId } from "@/lib/risk/compound-insights";
import type { AiChatRequest } from "@/types/ai";
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

async function loadLatestBloodworkReports(
  supabase: SupabaseClient,
  userId: string,
  limit = 3
): Promise<BloodworkReportWithResults[]> {
  const { data } = await supabase
    .from("bloodwork_reports")
    .select("*, bloodwork_results (*)")
    .eq("user_id", userId)
    .order("collection_date", { ascending: false })
    .limit(limit);

  return (data as BloodworkReportWithResults[] | null) ?? [];
}

async function loadCycleWithCompounds(
  supabase: SupabaseClient,
  cycleId: string,
  userId: string
): Promise<UserCycleWithCompounds | null> {
  const { data, error } = await supabase
    .from("user_cycles")
    .select(`*, cycle_compounds (${CYCLE_COMPOUND_SELECT})`)
    .eq("id", cycleId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    cycle_compounds: [...(data.cycle_compounds ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  } as UserCycleWithCompounds;
}

async function loadUserCycles(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; cycle_name: string; updated_at: string }[]> {
  const { data } = await supabase
    .from("user_cycles")
    .select("id, cycle_name, updated_at, end_date")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(10);

  return data ?? [];
}

export async function buildChatContext(
  supabase: SupabaseClient,
  userId: string,
  preferredCycleId?: string | null
): Promise<AiChatRequest> {
  const [profileResult, reports, cycles] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    loadLatestBloodworkReports(supabase, userId, 3),
    loadUserCycles(supabase, userId),
  ]);

  const profile = (profileResult.data as Profile | null) ?? null;
  const latestReport = reports[0] ?? null;
  const cycleId =
    preferredCycleId ||
    (cycles.length ? pickDefaultCycleId(cycles) : null);

  let cycle: UserCycleWithCompounds | null = null;
  let riskAssessment = null;

  if (cycleId) {
    cycle = await loadCycleWithCompounds(supabase, cycleId, userId);
    if (cycle && cycle.cycle_compounds.length > 0) {
      const rules = await fetchEnabledRiskRules();
      const assessment = calculateRiskAssessment(
        {
          user_profile: profileToRiskInput(profile),
          cycle: cycleToRiskInput(cycle),
          bloodwork: bloodworkToRiskInput(latestReport),
          goal: cycle.goal,
        },
        rules
      );
      riskAssessment = riskToAiContext(assessment);
    }
  }

  const bloodworkTrends = reports.flatMap((report) =>
    report.bloodwork_results.map((br) => ({
      marker_name: br.marker_name,
      collection_date: report.collection_date,
      result_value: Number(br.result_value),
      unit: br.unit,
      status: br.status,
    }))
  );

  return {
    message: "",
    context_type: "general",
    profile: profileToAiContext(profile),
    report: latestReport ? reportToAiContext(latestReport) : null,
    cycle: cycle ? cycleToAiContext(cycle) : null,
    risk_assessment: riskAssessment,
    bloodwork_trends: bloodworkTrends,
  };
}

export async function saveChatMessage(
  supabase: SupabaseClient,
  userId: string,
  role: "user" | "assistant",
  content: string,
  sources: unknown[] = []
): Promise<void> {
  // Chat messages are session-only; not persisted to Supabase.
  void supabase;
  void userId;
  void role;
  void content;
  void sources;
}

export async function clearChatHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase.from("ai_chat_messages").delete().eq("user_id", userId);
}

export async function fetchChatHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
) {
  const { data } = await supabase
    .from("ai_chat_messages")
    .select("role, content, sources, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return data ?? [];
}
