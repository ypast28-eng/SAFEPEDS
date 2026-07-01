"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteCycle, duplicateCycle, fetchUserCycles } from "@/services/cycles";
import { useAuth } from "@/hooks/useAuth";
import type { UserCycleWithCount } from "@/types/cycles";

export function useUserCycles() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<UserCycleWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCycles([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await fetchUserCycles();
    setCycles(data);
    setError(err);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await deleteCycle(id);
      if (!err) await refresh();
      return { error: err };
    },
    [refresh]
  );

  const duplicate = useCallback(
    async (id: string) => {
      if (!user) return { data: null, error: "Not authenticated" };
      const result = await duplicateCycle(user.id, id);
      if (!result.error) await refresh();
      return result;
    },
    [user, refresh]
  );

  return { cycles, isLoading, error, refresh, remove, duplicate };
}
