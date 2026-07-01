import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { tryCreateClient } from "@/lib/supabase/client";
import { MOCK_CATEGORIES, MOCK_COMPOUNDS } from "@/lib/mock/compounds";
import type {
  Compound,
  CompoundCategory,
  CompoundFilters,
  CompoundProfile,
  CompoundWithRelations,
} from "@/types/compounds";
import type { SupabaseClient } from "@supabase/supabase-js";

const COMPOUND_SELECT_WITH_RELATIONS = `
  *,
  category:compound_categories (*),
  profile:compound_profiles (*)
`;

function toCompoundWithRelations(
  row: Compound & {
    category?: CompoundCategory | null;
    profile?: CompoundProfile | null;
  }
): CompoundWithRelations {
  const { category = null, profile = null, ...base } = row;
  return {
    ...base,
    category_id: base.category_id ?? "",
    category,
    profile,
  };
}

function applyClientFilters(
  list: CompoundWithRelations[],
  filters: CompoundFilters
): CompoundWithRelations[] {
  let result = list;
  if (filters.categoryId) {
    result = result.filter((c) => c.category_id === filters.categoryId);
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim().toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(s));
  }
  return result;
}

async function enrichCompounds(
  supabase: SupabaseClient,
  rows: Compound[]
): Promise<CompoundWithRelations[]> {
  if (rows.length === 0) return [];

  const categoryIds = [
    ...new Set(rows.map((c) => c.category_id).filter((id): id is string => Boolean(id))),
  ];
  const compoundIds = rows.map((c) => c.id);

  const categoriesById = new Map<string, CompoundCategory>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("compound_categories")
      .select("*")
      .in("id", categoryIds);
    for (const cat of (categories ?? []) as CompoundCategory[]) {
      categoriesById.set(cat.id, cat);
    }
  }

  const profilesByCompoundId = new Map<string, CompoundProfile>();
  const { data: profiles, error: profileError } = await supabase
    .from("compound_profiles")
    .select("*")
    .in("compound_id", compoundIds);
  if (!profileError) {
    for (const profile of (profiles ?? []) as CompoundProfile[]) {
      profilesByCompoundId.set(profile.compound_id, profile);
    }
  }

  return rows.map((row) =>
    toCompoundWithRelations({
      ...row,
      category: row.category_id ? (categoriesById.get(row.category_id) ?? null) : null,
      profile: profilesByCompoundId.get(row.id) ?? null,
    })
  );
}

async function fetchActiveCompounds(
  supabase: SupabaseClient,
  filters: CompoundFilters
): Promise<{ data: CompoundWithRelations[]; error: string | null }> {
  let query = supabase.from("compounds").select("*").eq("active", true).order("name");

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  const enriched = await enrichCompounds(supabase, (data ?? []) as Compound[]);
  return { data: applyClientFilters(enriched, filters), error: null };
}

async function fetchActiveCompoundsWithRelations(
  supabase: SupabaseClient,
  filters: CompoundFilters
): Promise<{ data: CompoundWithRelations[]; error: string | null }> {
  let query = supabase
    .from("compounds")
    .select(COMPOUND_SELECT_WITH_RELATIONS)
    .eq("active", true)
    .order("name");

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: ((data ?? []) as CompoundWithRelations[]).map(toCompoundWithRelations),
    error: null,
  };
}

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

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as CompoundCategory[], error: null };
}

export async function fetchCompounds(
  filters: CompoundFilters = {}
): Promise<{ data: CompoundWithRelations[]; error: string | null }> {
  if (!isSupabaseEnvConfigured()) {
    return { data: applyClientFilters([...MOCK_COMPOUNDS], filters), error: null };
  }

  const supabase = tryCreateClient()!;

  const withRelations = await fetchActiveCompoundsWithRelations(supabase, filters);
  if (!withRelations.error) {
    return withRelations;
  }

  return fetchActiveCompounds(supabase, filters);
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
    .select(COMPOUND_SELECT_WITH_RELATIONS)
    .eq("id", id)
    .maybeSingle();

  if (!error && data) {
    return { data: toCompoundWithRelations(data as CompoundWithRelations), error: null };
  }

  const { data: compound, error: compoundError } = await supabase
    .from("compounds")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (compoundError) {
    return { data: null, error: compoundError.message };
  }

  if (!compound) {
    return { data: null, error: null };
  }

  const [enriched] = await enrichCompounds(supabase, [compound as Compound]);
  return { data: enriched ?? null, error: null };
}
