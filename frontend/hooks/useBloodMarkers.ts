"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBloodMarkers } from "@/services/bloodwork";
import type { BloodMarker } from "@/types/bloodwork";

export function useBloodMarkers() {
  const [markers, setMarkers] = useState<BloodMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error: err } = await fetchBloodMarkers();
    setMarkers(data);
    setError(err);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const categories = [...new Set(markers.map((m) => m.category))].sort();

  return { markers, categories, isLoading, error, refresh };
}
