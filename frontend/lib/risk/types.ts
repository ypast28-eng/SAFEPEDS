export interface RiskRuleConfig {
  rule_key: string;
  category_slug: string;
  name: string;
  condition: Record<string, unknown>;
  weight: number;
  evidence_placeholder?: string | null;
  explanation: string;
  enabled: boolean;
}
