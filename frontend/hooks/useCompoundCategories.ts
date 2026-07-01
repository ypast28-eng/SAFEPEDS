"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCompoundCategories } from "@/services/compounds";
import type { CompoundCategory } from "@/types/compounds";

export function useCompoundCategories() {
  const [categories, setCategories] = useState<CompoundCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await fetchCompoundCategories();
    setCategories(data);
    setError(err);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, isLoading, error, refresh: load };
}
