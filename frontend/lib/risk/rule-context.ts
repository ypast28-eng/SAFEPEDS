import type {
  BloodworkMarkerInput,
  CycleCompoundInput,
  CompoundProfileInput,
  RiskEngineInput,
} from "@/types/risk";

export class RuleContext {
  readonly data: RiskEngineInput;
  readonly compounds: CycleCompoundInput[];
  readonly bloodwork: BloodworkMarkerInput[];
  readonly categories: Set<string>;
  readonly compoundTypes: Set<string>;
  readonly administrations: Set<string>;
  readonly compoundNames: string[];

  constructor(data: RiskEngineInput) {
    this.data = data;
    this.compounds = data.cycle.compounds ?? [];
    this.bloodwork = data.bloodwork ?? [];
    this.categories = new Set(
      this.compounds.map((c) => c.category).filter((c): c is string => Boolean(c))
    );
    this.compoundTypes = new Set(
      this.compounds.map((c) => c.compound_type).filter((c): c is string => Boolean(c))
    );
    this.administrations = new Set(
      this.compounds.map((c) => c.administration).filter((c): c is string => Boolean(c))
    );
    this.compoundNames = this.compounds.map((c) => c.name);
  }

  injectableCount(): number {
    return this.compounds.filter((c) =>
      ["intramuscular", "subcutaneous", "intravenous"].includes(c.administration ?? "")
    ).length;
  }

  maxFrequency(): number {
    if (this.compounds.length === 0) return 0;
    return Math.max(...this.compounds.map((c) => c.frequency_per_week ?? 1));
  }

  maxDuration(): number {
    if (this.compounds.length === 0) return 0;
    return Math.max(...this.compounds.map((c) => c.duration_weeks ?? 0));
  }

  hasCategory(category: string): boolean {
    return this.categories.has(category);
  }

  bloodworkStatus(marker: string, status: string): boolean {
    return this.bloodwork.some(
      (b) => b.marker_name.toLowerCase() === marker.toLowerCase() && b.status === status
    );
  }
}

function profileField(profile: CompoundProfileInput | null | undefined, field: string): number | null {
  if (!profile) return null;
  const value = profile[field as keyof CompoundProfileInput];
  return typeof value === "number" ? value : null;
}

export function evaluateCondition(
  condition: Record<string, unknown>,
  ctx: RuleContext
): boolean {
  const ruleType = String(condition.type ?? "always");

  if (ruleType === "always") return true;

  if (ruleType === "compound_count_gte") {
    return ctx.compounds.length >= Number(condition.threshold ?? 0);
  }

  if (ruleType === "injectable_count_gte") {
    return ctx.injectableCount() >= Number(condition.threshold ?? 0);
  }

  if (ruleType === "max_frequency_gte") {
    return ctx.maxFrequency() >= Number(condition.threshold ?? 0);
  }

  if (ruleType === "max_duration_gte") {
    return ctx.maxDuration() >= Number(condition.threshold ?? 0);
  }

  if (ruleType === "has_administration") {
    return ctx.administrations.has(String(condition.value ?? ""));
  }

  if (ruleType === "has_compound_type") {
    return ctx.compoundTypes.has(String(condition.value ?? ""));
  }

  if (ruleType === "compound_type_any") {
    const values = new Set(
      Array.isArray(condition.values) ? condition.values.map(String) : []
    );
    return [...ctx.compoundTypes].some((t) => values.has(t));
  }

  if (ruleType === "compound_category_contains") {
    return ctx.hasCategory(String(condition.category ?? ""));
  }

  if (ruleType === "not_has_category") {
    return !ctx.hasCategory(String(condition.category ?? ""));
  }

  if (ruleType === "compound_name_contains") {
    const substring = String(condition.substring ?? "").toLowerCase();
    return ctx.compoundNames.some((name) => name.toLowerCase().includes(substring));
  }

  if (ruleType === "compound_profile_gte") {
    const field = String(condition.field ?? "");
    const threshold = Number(condition.threshold ?? 0);
    return ctx.compounds.some((compound) => {
      const value = profileField(compound.profile, field);
      return value != null && value >= threshold;
    });
  }

  if (ruleType === "bloodwork_marker_status") {
    return ctx.bloodworkStatus(String(condition.marker ?? ""), String(condition.status ?? ""));
  }

  if (ruleType === "bloodwork_absent") {
    return ctx.bloodwork.length === 0;
  }

  return false;
}
