import type { DoseUnit } from "@/lib/constants/cycles";
import type { CompoundWithRelations } from "./compounds";

export interface UserCycle {
  id: string;
  user_id: string;
  cycle_name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleCompound {
  id: string;
  cycle_id: string;
  compound_id: string;
  weekly_dose: number;
  unit: DoseUnit;
  frequency_per_week: number;
  duration_weeks: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface CycleCompoundWithDetails extends CycleCompound {
  compound: CompoundWithRelations | null;
}

export interface UserCycleWithCount extends UserCycle {
  compound_count: number;
}

export interface UserCycleWithCompounds extends UserCycle {
  cycle_compounds: CycleCompoundWithDetails[];
}

/** Form state for a compound line item in the builder */
export interface CycleCompoundDraft {
  localId: string;
  compound_id: string;
  compound: CompoundWithRelations;
  weekly_dose: string;
  unit: DoseUnit;
  frequency_per_week: number;
  duration_weeks: string;
  notes: string;
}

export interface CycleMetadataDraft {
  cycle_name: string;
  goal: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export interface SaveCyclePayload {
  metadata: CycleMetadataDraft;
  compounds: CycleCompoundDraft[];
}
