import type { CycleCompoundInput } from "@/types/risk";

export interface CompoundRiskHighlight {
  compound_id: string;
  name: string;
  weekly_dose: number;
  unit: string;
  frequency_per_week: number;
  duration_weeks: number;
  category: string | null;
  administration: string | null;
  flags: string[];
}

const PROFILE_FLAGS: Array<{
  field: keyof NonNullable<CycleCompoundInput["profile"]>;
  label: string;
  threshold: number;
}> = [
  { field: "liver_toxicity", label: "Liver monitoring context", threshold: 4 },
  { field: "kidney_toxicity", label: "Kidney monitoring context", threshold: 4 },
  { field: "cardiovascular_toxicity", label: "Cardiovascular monitoring context", threshold: 4 },
  { field: "lipid_impact", label: "Lipid panel context", threshold: 4 },
  { field: "blood_pressure_impact", label: "Blood pressure context", threshold: 4 },
  { field: "hematocrit_impact", label: "Hematocrit / CBC context", threshold: 4 },
  { field: "estrogenic_activity", label: "Estrogen / aromatization context", threshold: 4 },
  { field: "androgenic_activity", label: "Androgenic / acne / hair context", threshold: 4 },
  { field: "prolactin_activity", label: "Prolactin / 19-nor context", threshold: 4 },
];

export function buildCompoundRiskHighlights(
  compounds: CycleCompoundInput[]
): CompoundRiskHighlight[] {
  return compounds.map((compound) => {
    const flags: string[] = [];

    for (const { field, label, threshold } of PROFILE_FLAGS) {
      const value = compound.profile?.[field];
      if (value != null && value >= threshold) {
        flags.push(`${label} (profile ${value}/10)`);
      }
    }

    if ((compound.frequency_per_week ?? 1) >= 3) {
      flags.push(`Higher injection frequency (${compound.frequency_per_week}x/week)`);
    }

    if ((compound.duration_weeks ?? 0) >= 16) {
      flags.push(`Longer planned duration (${compound.duration_weeks} weeks)`);
    }

    if (compound.administration === "oral") {
      flags.push("Oral administration — hepatic monitoring context");
    }

    if (flags.length === 0) {
      flags.push("General educational monitoring for this compound");
    }

    return {
      compound_id: compound.compound_id,
      name: compound.name,
      weekly_dose: compound.weekly_dose,
      unit: compound.unit ?? "mg",
      frequency_per_week: compound.frequency_per_week ?? 1,
      duration_weeks: compound.duration_weeks ?? 0,
      category: compound.category ?? null,
      administration: compound.administration ?? null,
      flags,
    };
  });
}

export function pickDefaultCycleId(
  cycles: Array<{ id: string; end_date?: string | null; updated_at?: string }>
): string {
  if (cycles.length === 0) return "";
  const today = new Date().toISOString().split("T")[0];
  const active = cycles.find((c) => !c.end_date || c.end_date >= today);
  return active?.id ?? cycles[0].id;
}
