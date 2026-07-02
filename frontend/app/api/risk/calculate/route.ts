import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateRiskAssessment } from "@/lib/risk/engine";
import { fetchEnabledRiskRules, saveRiskAssessment } from "@/lib/risk/rules-repository";
import type { RiskEngineInput } from "@/types/risk";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      input?: RiskEngineInput;
      userId?: string;
      save?: boolean;
    };

    if (!body.input?.cycle) {
      return NextResponse.json({ error: "Risk input with cycle is required" }, { status: 400 });
    }

    if (body.userId && body.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rules = await fetchEnabledRiskRules();
    const result = calculateRiskAssessment(body.input, rules);

    if (body.save !== false) {
      await saveRiskAssessment(
        user.id,
        "single_cycle",
        body.input as unknown as Record<string, unknown>,
        result as unknown as Record<string, unknown>,
        result.overall_score,
        body.input.cycle.cycle_id ?? null
      );
    }

    return NextResponse.json({
      ...result,
      rules_source: rules.length > 3 ? "supabase" : "fallback",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Risk calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
