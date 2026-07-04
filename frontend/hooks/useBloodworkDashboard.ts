"use client";

import { useCallback, useEffect, useState } from "react";
import { BLOODWORK_REPORTS_CHANGED_EVENT } from "@/lib/bloodwork/report-events";
import { deleteReport, fetchReportsWithStats } from "@/services/bloodwork";
import type { BloodworkDashboardStats } from "@/types/bloodwork";

const EMPTY_STATS: BloodworkDashboardStats = {
  totalReports: 0,
  latestReport: null,
  previousReports: [],
  totalOutOfRange: 0,
  latestCruiseReport: null,
  latestBlastReport: null,
  hasCruiseBaseline: false,
};

export function useBloodworkDashboard() {
  const [stats, setStats] = useState<BloodworkDashboardStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await fetchReportsWithStats();
    setStats(data);
    setError(err);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onReportsChanged = () => {
      void refresh();
    };

    window.addEventListener(BLOODWORK_REPORTS_CHANGED_EVENT, onReportsChanged);
    return () => window.removeEventListener(BLOODWORK_REPORTS_CHANGED_EVENT, onReportsChanged);
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await deleteReport(id);
      if (!err) await refresh();
      return { error: err };
    },
    [refresh]
  );

  return { stats, isLoading, error, refresh, remove };
}
