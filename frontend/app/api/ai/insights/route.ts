import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildInsightsContext } from "@/lib/ai/insights/build-context";
import { generateInsightsWithAi } from "@/lib/ai/insights/generate";
import { generateInsightsFallback } from "@/lib/ai/insights/fallback";
import { loadEducationContent } from "@/lib/ai/load-education-content";
import { isOpenAiConfigured } from "@/lib/ai/openai-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ configured: isOpenAiConfigured() });
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[insights] unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = await buildInsightsContext(supabase, user.id);

    if (ctx.current_bloodwork.length === 0 && ctx.historical_bloodwork.length === 0) {
      return NextResponse.json(
        {
          error: "no_bloodwork",
          message: "No bloodwork available. Upload a lab report to generate AI insights.",
        },
        { status: 400 }
      );
    }

    if (!isOpenAiConfigured()) {
      console.warn("[insights] OPENAI_API_KEY is missing — returning deterministic analysis");
      const dashboard = generateInsightsFallback(ctx);
      return NextResponse.json({
        ...dashboard,
        openai_configured: false,
        setup_error: "OPENAI_API_KEY is missing",
      });
    }

    const markerNames = ctx.current_bloodwork.map((m) => m.marker_name).slice(0, 10);
    const education = await loadEducationContent(
      supabase,
      markerNames.join(" "),
      markerNames
    );

    const outcome = await generateInsightsWithAi(ctx, education);

    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.message, code: outcome.code },
        { status: outcome.status }
      );
    }

    return NextResponse.json({ ...outcome.dashboard, openai_configured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to generate AI report";
    console.error("[insights] route error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
