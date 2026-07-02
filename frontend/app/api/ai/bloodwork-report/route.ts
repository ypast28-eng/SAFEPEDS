import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBloodworkReportWithAi } from "@/lib/ai/bloodwork-report-generate";
import { loadEducationContent } from "@/lib/ai/load-education-content";
import { isOpenAiConfigured } from "@/lib/ai/openai-config";
import { profileToAiContext, reportToAiContext } from "@/lib/ai/transform";
import type { AiBloodworkReportRequest } from "@/types/ai";
import type { BloodworkReportWithResults } from "@/types/bloodwork";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";

async function loadReportForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  userId: string
): Promise<BloodworkReportWithResults | null> {
  const { data, error } = await supabase
    .from("bloodwork_reports")
    .select("*, bloodwork_results (*)")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BloodworkReportWithResults;
}

async function loadHistoricalTrends(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  excludeReportId: string
) {
  const { data } = await supabase
    .from("bloodwork_reports")
    .select("id, collection_date, bloodwork_results (marker_name, result_value, unit, status)")
    .eq("user_id", userId)
    .neq("id", excludeReportId)
    .order("collection_date", { ascending: false })
    .limit(5);

  return (data ?? []).flatMap((report) =>
    (report.bloodwork_results ?? []).map((br: {
      marker_name: string;
      result_value: number;
      unit: string;
      status?: string | null;
    }) => ({
      marker_name: br.marker_name,
      collection_date: report.collection_date,
      result_value: Number(br.result_value),
      unit: br.unit,
      status: br.status,
    }))
  );
}

async function buildRequestFromReportId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportId: string,
  userId: string
): Promise<AiBloodworkReportRequest | null> {
  const [report, profileResult, trends] = await Promise.all([
    loadReportForUser(supabase, reportId, userId),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    loadHistoricalTrends(supabase, userId, reportId),
  ]);

  if (!report) return null;

  return {
    profile: profileToAiContext((profileResult.data as Profile | null) ?? null),
    report: reportToAiContext(report),
    historical_trends: trends,
  };
}

export async function GET() {
  return NextResponse.json({
    configured: isOpenAiConfigured(),
  });
}

export async function POST(request: Request) {
  if (!isOpenAiConfigured()) {
    console.warn("[bloodwork-report] OPENAI_API_KEY is missing");
    return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[bloodwork-report] unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      request?: AiBloodworkReportRequest;
      reportId?: string;
    };

    let reportRequest = body.request ?? null;

    if (body.reportId) {
      reportRequest = await buildRequestFromReportId(supabase, body.reportId, user.id);
      if (!reportRequest) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
    }

    if (!reportRequest?.report?.markers?.length) {
      return NextResponse.json(
        { error: "Bloodwork report with at least one marker is required" },
        { status: 400 }
      );
    }

    const markerNames = reportRequest.report.markers
      .map((m) => m.marker_name)
      .filter(Boolean)
      .slice(0, 8);

    const education = await loadEducationContent(
      supabase,
      markerNames.join(" "),
      markerNames
    );

    const outcome = await generateBloodworkReportWithAi(reportRequest, education);

    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.message, code: outcome.code },
        { status: outcome.status }
      );
    }

    return NextResponse.json(outcome.result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate bloodwork report";
    console.error("[bloodwork-report] unexpected error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
