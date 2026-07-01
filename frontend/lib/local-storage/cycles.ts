import { readJson, writeJson } from "@/lib/local-storage/store";
import { LS_CYCLES_KEY } from "@/lib/local-storage/keys";
import type {
  CycleCompoundDraft,
  CycleMetadataDraft,
  UserCycleWithCompounds,
  UserCycleWithCount,
} from "@/types/cycles";
import { LOCAL_USER_ID } from "@/lib/runtime/config";

function nowIso() {
  return new Date().toISOString();
}

function loadAll(): UserCycleWithCompounds[] {
  return readJson<UserCycleWithCompounds[]>(LS_CYCLES_KEY, []);
}

function saveAll(cycles: UserCycleWithCompounds[]) {
  writeJson(LS_CYCLES_KEY, cycles);
}

export function localFetchUserCycles(): UserCycleWithCount[] {
  return loadAll().map((c) => ({
    ...c,
    compound_count: c.cycle_compounds.length,
  }));
}

export function localFetchCycleById(id: string): UserCycleWithCompounds | null {
  return loadAll().find((c) => c.id === id) ?? null;
}

export function localSaveCycle(
  cycleId: string | null,
  metadata: CycleMetadataDraft,
  compounds: CycleCompoundDraft[]
): { id: string } {
  const all = loadAll();
  const ts = nowIso();
  const id = cycleId ?? crypto.randomUUID();

  const cycle_compounds = compounds.map((c, index) => ({
    id: crypto.randomUUID(),
    cycle_id: id,
    compound_id: c.compound_id,
    weekly_dose: parseFloat(c.weekly_dose) || 0,
    unit: c.unit,
    frequency_per_week: c.frequency_per_week,
    duration_weeks: parseInt(c.duration_weeks, 10) || 0,
    notes: c.notes.trim() || null,
    sort_order: index,
    created_at: ts,
    compound: c.compound,
  }));

  const payload: UserCycleWithCompounds = {
    id,
    user_id: LOCAL_USER_ID,
    cycle_name: metadata.cycle_name.trim(),
    goal: metadata.goal.trim() || null,
    start_date: metadata.start_date || null,
    end_date: metadata.end_date || null,
    notes: metadata.notes.trim() || null,
    created_at: cycleId ? all.find((c) => c.id === cycleId)?.created_at ?? ts : ts,
    updated_at: ts,
    cycle_compounds,
  };

  const next = cycleId ? all.map((c) => (c.id === cycleId ? payload : c)) : [payload, ...all];
  saveAll(next);
  return { id };
}

export function localDeleteCycle(id: string): void {
  saveAll(loadAll().filter((c) => c.id !== id));
}

export function localDuplicateCycle(cycleId: string): { id: string } | null {
  const original = localFetchCycleById(cycleId);
  if (!original) return null;

  const drafts: CycleCompoundDraft[] = original.cycle_compounds
    .filter((cc) => cc.compound)
    .map((cc) => ({
      localId: crypto.randomUUID(),
      compound_id: cc.compound_id,
      compound: cc.compound!,
      weekly_dose: String(cc.weekly_dose),
      unit: cc.unit,
      frequency_per_week: cc.frequency_per_week,
      duration_weeks: String(cc.duration_weeks),
      notes: cc.notes ?? "",
    }));

  return localSaveCycle(null, {
    cycle_name: `${original.cycle_name} (Copy)`,
    goal: original.goal ?? "",
    start_date: original.start_date ?? "",
    end_date: original.end_date ?? "",
    notes: original.notes ?? "",
  }, drafts);
}
