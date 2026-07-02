import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RiskHistoryEntry } from "@/types/risk";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const { data, error } = await supabase
      .from("risk_assessments")
      .select("id, cycle_id, assessment_type, overall_score, created_at, output")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const entries: RiskHistoryEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      cycle_id: row.cycle_id,
      assessment_type: row.assessment_type,
      overall_score: row.overall_score,
      created_at: row.created_at,
      output: row.output as RiskHistoryEntry["output"],
    }));

    return NextResponse.json(entries);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load risk history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
