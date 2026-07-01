"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchHistoryForMarker } from "@/services/bloodwork";
import type { BloodworkHistoryPoint, TrendTimeRange } from "@/types/bloodwork";

export function useBloodworkHistory(markerName: string, range: TrendTimeRange) {
  const [history, setHistory] = useState<BloodworkHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!markerName) {
      setHistory([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data, error: err } = await fetchHistoryForMarker(markerName, range);
    setHistory(data);
    setError(err);
    setIsLoading(false);
  }, [markerName, range]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, isLoading, error, refresh };
}
