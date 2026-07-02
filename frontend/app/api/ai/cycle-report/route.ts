import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCycleReportWithAi } from "@/lib/ai/cycle-report-generate";
import {
  isOpenAiConfigured,
  OPENAI_AI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/openai-config";
import { calculateRiskAssessment } from "@/lib/risk/engine";
import { fetchEnabledRiskRules } from "@/lib/risk/rules-repository";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import { profileToAiContext, riskToAiContext, cycleToAiContext } from "@/lib/ai/transform";
import type { AiCycleReportRequest } from "@/types/ai";
import type { UserCycleWithCompounds } from "@/types/cycles";
import type { BloodworkReportWithResults } from "@/types/bloodwork";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";

const CYCLE_COMPOUND_SELECT = `
  *,
  compound:compounds (
    *,
    category:compound_categories (*),
    profile:compound_profiles (*)
  )
`;

export async function GET() {
  return NextResponse.json({
    configured: isOpenAiConfigured(),
    setupInstructions: isOpenAiConfigured() ? null : OPENAI_AI_SETUP_INSTRUCTIONS,
  });
}

async function loadCycleForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function loadLatestBloodworkReport(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function buildRequestFromCycleId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cycleId: string,
  userId: string
): Promise<AiCycleReportRequest | null> {
  const [cycle, profileResult, latestReport] = await Promise.all([
    loadCycleForUser(supabase, cycleId, userId),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    loadLatestBloodworkReport(supabase, userId),
  ]);

  if (!cycle) return null;

  const rules = await fetchEnabledRiskRules();
  const assessment = calculateRiskAssessment(
    {
      user_profile: profileToRiskInput((profileResult.data as Profile | null) ?? null),
      cycle: cycleToRiskInput(cycle),
      bloodwork: bloodworkToRiskInput(latestReport),
      goal: cycle.goal,
    },
    rules
  );

  return {
    profile: profileToAiContext((profileResult.data as Profile | null) ?? null),
    cycle: cycleToAiContext(cycle),
    risk_assessment: riskToAiContext(assessment),
    bloodwork: latestReport?.bloodwork_results.map((r) => ({
      marker_name: r.marker_name,
      result_value: Number(r.result_value),
      unit: r.unit,
      reference_low: r.reference_low,
      reference_high: r.reference_high,
      status: r.status,
      category: r.category,
    })),
  };
}

export async function POST(request: Request) {
  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      {
        code: "setup_required",
        message: OPENAI_AI_SETUP_INSTRUCTIONS,
      },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      request?: AiCycleReportRequest;
      cycleId?: string;
    };

    let reportRequest = body.request ?? null;

    if (body.cycleId) {
      reportRequest = await buildRequestFromCycleId(supabase, body.cycleId, user.id);
      if (!reportRequest) {
        return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
      }
    }

    if (!reportRequest?.cycle || !reportRequest?.risk_assessment) {
      return NextResponse.json(
        { error: "Cycle report request with cycle and risk_assessment is required" },
        { status: 400 }
      );
    }

    const result = await generateCycleReportWithAi(reportRequest);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate cycle report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
