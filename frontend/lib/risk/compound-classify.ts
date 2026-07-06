import type { CycleCompoundInput } from "@/types/risk";

function norm(value: string): string {
  return value.toLowerCase();
}

export function isTrenbolone(name: string): boolean {
  return /trenbolone|\btren\b/.test(norm(name));
}

export function isTestosterone(name: string, category?: string | null): boolean {
  const n = norm(name);
  const c = category ? norm(category) : "";
  return (
    /testosterone|test\s*e|test\s*c|test\s*p|sustanon/.test(n) ||
    c.includes("testosterone")
  );
}

export function isEquipoise(name: string, category?: string | null): boolean {
  const n = norm(name);
  const c = category ? norm(category) : "";
  return /equipoise|boldenone|\beq\b/.test(n) || c.includes("boldenone");
}

export function isMasteron(name: string): boolean {
  return /masteron|drostanolone/.test(norm(name));
}

export function isNandrolone(name: string): boolean {
  const n = norm(name);
  return (/deca|nandrolone|npp/.test(n) || n.includes("19-nor")) && !isTrenbolone(name);
}

export function is19Nor(name: string, category?: string | null): boolean {
  return isTrenbolone(name) || isNandrolone(name) || (category ? norm(category).includes("19-nor") : false);
}

export function isHgh(name: string, category?: string | null): boolean {
  const n = norm(name);
  const c = category ? norm(category) : "";
  return /hgh|growth hormone|somatropin|somatotropin/.test(n) || c.includes("growth hormone");
}

export function isOralCompound(compound: CycleCompoundInput): boolean {
  if (compound.administration === "oral") return true;
  const type = compound.compound_type ? norm(compound.compound_type) : "";
  return type.includes("oral");
}

export function isDhtDerivative(name: string): boolean {
  return /masteron|drostanolone|winstrol|stanozolol|primobolan|primo|proviron|dht/.test(norm(name));
}

export function isInjectable(compound: CycleCompoundInput): boolean {
  const route = compound.administration ? norm(compound.administration) : "";
  return (
    route.includes("intramuscular") ||
    route.includes("subcutaneous") ||
    route === "im" ||
    route === "sc"
  );
}

export function isAnabolicCompound(compound: CycleCompoundInput): boolean {
  if (isHgh(compound.name, compound.category)) return false;
  const type = compound.compound_type ? norm(compound.compound_type) : "";
  if (type === "pct" || type === "ancillary" || type === "support") return false;
  if (type === "anabolic" || type === "androgen") return true;
  return (
    isTrenbolone(compound.name) ||
    isTestosterone(compound.name, compound.category) ||
    isEquipoise(compound.name, compound.category) ||
    isMasteron(compound.name) ||
    isNandrolone(compound.name) ||
    isOralCompound(compound)
  );
}

export function getDailyIu(compound: CycleCompoundInput): number {
  const unit = norm(compound.unit ?? "mg");
  if (!unit.includes("iu")) return 0;
  const freq = compound.frequency_per_week ?? 7;
  if (freq >= 7) return compound.weekly_dose;
  return compound.weekly_dose / Math.max(freq, 1);
}

export function getCycleMaxDurationWeeks(compounds: CycleCompoundInput[]): number {
  if (compounds.length === 0) return 0;
  return Math.max(...compounds.map((c) => c.duration_weeks ?? 0));
}

export function getTotalAnabolicMgPerWeek(compounds: CycleCompoundInput[]): number {
  return compounds
    .filter(isAnabolicCompound)
    .filter((c) => !norm(c.unit ?? "mg").includes("iu"))
    .reduce((sum, c) => sum + c.weekly_dose, 0);
}
