"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCompounds } from "@/services/compounds";
import type { CompoundFilters, CompoundWithRelations } from "@/types/compounds";

export function useCompounds(filters: CompoundFilters) {
  const [compounds, setCompounds] = useState<CompoundWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = filters.search ?? "";
  const categoryId = filters.categoryId ?? null;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await fetchCompounds({ search, categoryId });
    setCompounds(data);
    setError(err);
    setIsLoading(false);
  }, [search, categoryId]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return { compounds, isLoading, error, refresh: load };
}
