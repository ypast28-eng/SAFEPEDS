export interface CompoundCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type CompoundType =
  | "anabolic"
  | "androgen"
  | "peptide"
  | "hormone"
  | "sarm"
  | "fat_loss"
  | "pct"
  | "ancillary"
  | "support"
  | "other";

export type Administration =
  | "oral"
  | "intramuscular"
  | "subcutaneous"
  | "intravenous"
  | "transdermal"
  | "nasal"
  | "other";

export interface Compound {
  id: string;
  category_id?: string | null;
  name: string;
  scientific_name: string | null;
  compound_type: CompoundType;
  administration: Administration;
  ester: string | null;
  half_life: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface CompoundProfile {
  compound_id: string;
  liver_toxicity: number | null;
  kidney_toxicity: number | null;
  cardiovascular_toxicity: number | null;
  lipid_impact: number | null;
  hematocrit_impact: number | null;
  blood_pressure_impact: number | null;
  estrogenic_activity: number | null;
  androgenic_activity: number | null;
  prolactin_activity: number | null;
  bloodwork_markers: string[];
  monitoring_frequency: string | null;
  mechanism_of_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Compound with joined category and profile — fetched from DB */
export interface CompoundWithRelations extends Compound {
  category: CompoundCategory | null;
  profile: CompoundProfile | null;
}

export interface CompoundFilters {
  search?: string;
  categoryId?: string | null;
}
