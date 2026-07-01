import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { tryCreateClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import {
  localDeleteCycle,
  localDuplicateCycle,
  localFetchCycleById,
  localFetchUserCycles,
  localSaveCycle,
} from "@/lib/local-storage/cycles";
import type { CycleCompoundDraft, CycleMetadataDraft, UserCycleWithCompounds, UserCycleWithCount } from "@/types/cycles";

const CYCLE_COMPOUND_SELECT = `
  *,
  compound:compounds (
    *,
    category:compound_categories (*),
    profile:compound_profiles (*)
  )
`;

export async function fetchUserCycles(): Promise<{
  data: UserCycleWithCount[];
  error: string | null;
}> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localFetchUserCycles(), error: null };
  }

  const supabase = tryCreateClient()!;
  const { data: cycles, error } = await supabase
    .from("user_cycles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  if (!cycles?.length) return { data: [], error: null };

  const { data: counts, error: countError } = await supabase
    .from("cycle_compounds")
    .select("cycle_id")
    .in(
      "cycle_id",
      cycles.map((c: { id: string }) => c.id)
    );

  if (countError) return { data: [], error: countError.message };

  const countMap = (counts ?? []).reduce<Record<string, number>>((acc: Record<string, number>, row: { cycle_id: string }) => {
    acc[row.cycle_id] = (acc[row.cycle_id] ?? 0) + 1;
    return acc;
  }, {});

  const result: UserCycleWithCount[] = cycles.map((cycle) => ({
    ...(cycle as UserCycleWithCount),
    compound_count: countMap[cycle.id] ?? 0,
  }));

  return { data: result, error: null };
}

export async function fetchCycleById(
  id: string
): Promise<{ data: UserCycleWithCompounds | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localFetchCycleById(id), error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase
    .from("user_cycles")
    .select(`*, cycle_compounds (${CYCLE_COMPOUND_SELECT})`)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const sorted = {
    ...data,
    cycle_compounds: [...(data.cycle_compounds ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  };

  return { data: sorted as UserCycleWithCompounds, error: null };
}

export async function deleteCycle(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    localDeleteCycle(id);
    return { error: null };
  }

  const supabase = tryCreateClient()!;
  const { error } = await supabase.from("user_cycles").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function saveCycle(
  userId: string,
  cycleId: string | null,
  metadata: CycleMetadataDraft,
  compounds: CycleCompoundDraft[]
): Promise<{ data: { id: string } | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: localSaveCycle(cycleId, metadata, compounds), error: null };
  }

  const supabase = tryCreateClient()!;

  const cyclePayload = {
    user_id: userId,
    cycle_name: metadata.cycle_name.trim(),
    goal: metadata.goal.trim() || null,
    start_date: metadata.start_date || null,
    end_date: metadata.end_date || null,
    notes: metadata.notes.trim() || null,
  };

  let savedCycleId = cycleId;

  if (cycleId) {
    const { error } = await supabase
      .from("user_cycles")
      .update(cyclePayload)
      .eq("id", cycleId);
    if (error) return { data: null, error: error.message };
  } else {
    const { data, error } = await supabase
      .from("user_cycles")
      .insert(cyclePayload)
      .select("id")
      .single();
    if (error) return { data: null, error: error.message };
    savedCycleId = data.id;
  }

  if (!savedCycleId) return { data: null, error: "Failed to save cycle" };

  const { error: deleteError } = await supabase
    .from("cycle_compounds")
    .delete()
    .eq("cycle_id", savedCycleId);

  if (deleteError) return { data: null, error: deleteError.message };

  if (compounds.length > 0) {
    const rows = compounds.map((c, index) => ({
      cycle_id: savedCycleId,
      compound_id: c.compound_id,
      weekly_dose: parseFloat(c.weekly_dose),
      unit: c.unit,
      frequency_per_week: c.frequency_per_week,
      duration_weeks: parseInt(c.duration_weeks, 10),
      notes: c.notes.trim() || null,
      sort_order: index,
    }));

    const { error: insertError } = await supabase.from("cycle_compounds").insert(rows);
    if (insertError) return { data: null, error: insertError.message };
  }

  return { data: { id: savedCycleId }, error: null };
}

export async function duplicateCycle(
  userId: string,
  cycleId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    const result = localDuplicateCycle(cycleId);
    return result ? { data: result, error: null } : { data: null, error: "Cycle not found" };
  }

  const { data: original, error } = await fetchCycleById(cycleId);
  if (error || !original) return { data: null, error: error ?? "Cycle not found" };

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

  return saveCycle(
    userId,
    null,
    {
      cycle_name: `${original.cycle_name} (Copy)`,
      goal: original.goal ?? "",
      start_date: original.start_date ?? "",
      end_date: original.end_date ?? "",
      notes: original.notes ?? "",
    },
    drafts
  );
}
