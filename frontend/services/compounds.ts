import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("compound_categories")
    .select("*")
    .order("name");

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as CompoundCategory[], error: null };
}

export async function fetchCompounds(
  filters: CompoundFilters = {}
): Promise<{ data: CompoundWithRelations[]; error: string | null }> {
  const supabase = createClient();
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

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as CompoundWithRelations[], error: null };
}

export async function fetchCompoundById(
  id: string
): Promise<{ data: CompoundWithRelations | null; error: string | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("compounds")
    .select(COMPOUND_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as CompoundWithRelations | null, error: null };
}
