import { createClient } from "@/lib/supabase/server";
import { FALLBACK_RISK_RULES } from "@/lib/risk/fallback-rules";
import type { RiskRuleConfig } from "@/lib/risk/types";

export async function fetchEnabledRiskRules(): Promise<RiskRuleConfig[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_rules")
      .select("*")
      .eq("enabled", true)
      .order("display_order");

    if (error || !data?.length) {
      return FALLBACK_RISK_RULES;
    }

    return data.map((row) => ({
      rule_key: row.rule_key,
      category_slug: row.category_slug,
      name: row.name,
      condition: (row.condition as Record<string, unknown>) ?? {},
      weight: Number(row.weight ?? 10),
      evidence_placeholder: row.evidence_placeholder,
      explanation: row.explanation ?? "",
      enabled: row.enabled ?? true,
    }));
  } catch {
    return FALLBACK_RISK_RULES;
  }
}

export async function saveRiskAssessment(
  userId: string,
  assessmentType: string,
  inputSnapshot: Record<string, unknown>,
  output: Record<string, unknown>,
  overallScore: number | null,
  cycleId?: string | null
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_assessments")
      .insert({
        user_id: userId,
        cycle_id: cycleId ?? null,
        assessment_type: assessmentType,
        input_snapshot: inputSnapshot,
        output,
        overall_score: overallScore,
      })
      .select("id")
      .single();

    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}
