import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { tryCreateClient } from "@/lib/supabase/client";
import { MOCK_CATEGORIES, MOCK_COMPOUNDS } from "@/lib/mock/compounds";
import type {
  CompoundCategory,
  CompoundFilters,
  CompoundWithRelations,
} from "@/types/compounds";

const COMPOUND_SELECT = `
  *,
  category:compound_categories (*),
  profile:compound_profiles (*)
`;

export async function fetchCompoundCategories(): Promise<{
  data: CompoundCategory[];
  error: string | null;
}> {
  if (!isSupabaseEnvConfigured()) {
    return { data: MOCK_CATEGORIES, error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase
    .from("compound_categories")
    .select("*")
    .order("name");

  if (error) return { data: MOCK_CATEGORIES, error: error.message };
  return { data: (data ?? MOCK_CATEGORIES) as CompoundCategory[], error: null };
}

export async function fetchCompounds(
  filters: CompoundFilters = {}
): Promise<{ data: CompoundWithRelations[]; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    let list = [...MOCK_COMPOUNDS];
    if (filters.categoryId) list = list.filter((c) => c.category_id === filters.categoryId);
    if (filters.search?.trim()) {
      const s = filters.search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(s));
    }
    return { data: list, error: null };
  }

  const supabase = tryCreateClient()!;
  let query = supabase
    .from("compounds")
    .select(COMPOUND_SELECT)
    .eq("active", true)
    .order("name");

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query.limit(100);

  if (error) return { data: MOCK_COMPOUNDS, error: error.message };
  return { data: (data ?? MOCK_COMPOUNDS) as CompoundWithRelations[], error: null };
}

export async function fetchCompoundById(
  id: string
): Promise<{ data: CompoundWithRelations | null; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: MOCK_COMPOUNDS.find((c) => c.id === id) ?? null, error: null };
  }

  const supabase = tryCreateClient()!;
  const { data, error } = await supabase
    .from("compounds")
    .select(COMPOUND_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as CompoundWithRelations | null, error: null };
}
