"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, GitCompare, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Select, Badge } from "@/components/ui";
import { RiskGauge } from "./RiskGauge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserCycles } from "@/hooks/useUserCycles";
import { fetchCycleById } from "@/services/cycles";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { compareCycles } from "@/services/risk";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import type { CompareCyclesResult } from "@/types/risk";
import { cn } from "@/utils/cn";

export function CompareCyclesView() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cycles } = useUserCycles();
  const [cycleAId, setCycleAId] = useState("");
  const [cycleBId, setCycleBId] = useState("");
  const [result, setResult] = useState<CompareCyclesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = cycles.map((c) => ({ label: c.cycle_name, value: c.id }));

  const handleCompare = useCallback(async () => {
    if (!user || !cycleAId || !cycleBId) return;
    if (cycleAId === cycleBId) {
      setError("Select two different cycles.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: cycleA }, { data: cycleB }, { data: stats }] = await Promise.all([
        fetchCycleById(cycleAId),
        fetchCycleById(cycleBId),
        fetchReportsWithStats(),
      ]);
      if (!cycleA || !cycleB) {
        setError("One or both cycles not found.");
        return;
      }
      const comparison = await compareCycles(
        {
          user_profile: profileToRiskInput(profile),
          cycle_a: cycleToRiskInput(cycleA),
          cycle_b: cycleToRiskInput(cycleB),
          bloodwork: bloodworkToRiskInput(stats.latestReport),
        },
        user.id
      );
      setResult(comparison);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, cycleAId, cycleBId]);

  return (
    <div>
      <PageHeader
        title="Compare Cycles"
        description="Side-by-side educational risk comparison between two saved cycles."
        badge="Educational Only"
        badgeVariant="warning"
        actions={
          <Link href="/risk">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Risk Dashboard
            </Button>
          </Link>
        }
      />

      <Card variant="elevated" padding="lg" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Cycle A"
            value={cycleAId}
            onChange={(e) => setCycleAId(e.target.value)}
            options={options}
            placeholder="Select first cycle"
          />
          <Select
            label="Cycle B"
            value={cycleBId}
            onChange={(e) => setCycleBId(e.target.value)}
            options={options}
            placeholder="Select second cycle"
          />
        </div>
        <Button onClick={handleCompare} isLoading={isLoading} disabled={!cycleAId || !cycleBId}>
          <GitCompare className="h-4 w-4" />
          Compare Cycles
        </Button>
      </Card>

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="gradient" padding="lg" className="text-center">
              <Badge variant="secondary" className="mb-4">{result.cycle_a_name}</Badge>
              <RiskGauge
                score={result.assessment_a.overall_score}
                level={result.assessment_a.overall_level}
                size="md"
              />
            </Card>
            <Card variant="gradient" padding="lg" className="text-center">
              <Badge variant="primary" className="mb-4">{result.cycle_b_name}</Badge>
              <RiskGauge
                score={result.assessment_b.overall_score}
                level={result.assessment_b.overall_level}
                size="md"
              />
            </Card>
          </div>

          <Card variant="elevated" padding="lg">
            <h3 className="text-base font-semibold text-foreground mb-4">Category Differences</h3>
            <div className="space-y-2">
              {result.category_comparisons
                .filter((c) => c.score_a > 0 || c.score_b > 0)
                .sort((a, b) => Math.abs(b.score_delta) - Math.abs(a.score_delta))
                .map((comp) => (
                  <div
                    key={comp.category}
                    className="flex items-center justify-between py-2 border-b border-border/30 last:border-0 text-sm"
                  >
                    <span className="text-foreground font-medium">{comp.category_name}</span>
                    <div className="flex items-center gap-4 text-muted">
                      <span>{comp.score_a}</span>
                      <span>→</span>
                      <span>{comp.score_b}</span>
                      <span
                        className={cn(
                          "font-semibold min-w-[48px] text-right",
                          comp.score_delta > 0 ? "text-secondary" : comp.score_delta < 0 ? "text-primary" : "text-muted"
                        )}
                      >
                        {comp.score_delta > 0 ? "+" : ""}
                        {comp.score_delta}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {(result.compound_differences.length > 0 || result.duration_differences.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.compound_differences.length > 0 && (
                <Card variant="bordered" padding="md">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Compound Differences</h4>
                  <ul className="space-y-1.5 text-xs text-muted">
                    {result.compound_differences.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {result.duration_differences.length > 0 && (
                <Card variant="bordered" padding="md">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Duration Differences</h4>
                  <ul className="space-y-1.5 text-xs text-muted">
                    {result.duration_differences.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {result.monitoring_considerations.length > 0 && (
            <Card variant="bordered" padding="md">
              <h4 className="text-sm font-semibold text-foreground mb-3">Monitoring Considerations</h4>
              <ul className="space-y-1.5 text-xs text-muted">
                {result.monitoring_considerations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Card>
          )}

          <p className="text-xs text-muted/70 text-center">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
