import type { RiskRuleConfig } from "@/lib/risk/types";

/** Minimal rules when Supabase risk_rules cannot be loaded */
export const FALLBACK_RISK_RULES: RiskRuleConfig[] = [
  {
    rule_key: "liver_base",
    category_slug: "liver",
    name: "Base liver monitoring",
    condition: { type: "always" },
    weight: 15,
    evidence_placeholder: "Placeholder",
    explanation: "Baseline hepatic monitoring consideration.",
    enabled: true,
  },
  {
    rule_key: "overall_base",
    category_slug: "overall_monitoring_priority",
    name: "Base monitoring priority",
    condition: { type: "always" },
    weight: 20,
    evidence_placeholder: "Placeholder",
    explanation: "Baseline overall monitoring priority.",
    enabled: true,
  },
  {
    rule_key: "compound_count",
    category_slug: "overall_monitoring_priority",
    name: "Compound stack size",
    condition: { type: "compound_count_gte", threshold: 2 },
    weight: 10,
    evidence_placeholder: "Placeholder",
    explanation: "Multiple compounds increase monitoring complexity.",
    enabled: true,
  },
];
