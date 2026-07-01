"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  GitCompare,
  FlaskConical,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Select } from "@/components/ui";
import { RiskGauge } from "./RiskGauge";
import { CategoryRiskCard } from "./CategoryRiskCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserCycles } from "@/hooks/useUserCycles";
import { fetchCycleById } from "@/services/cycles";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { calculateRisk, fetchRiskHistory } from "@/services/risk";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import type { RiskAssessmentResult, RiskHistoryEntry } from "@/types/risk";

export function RiskDashboardView() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cycles, isLoading: cyclesLoading } = useUserCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [assessment, setAssessment] = useState<RiskAssessmentResult | null>(null);
  const [history, setHistory] = useState<RiskHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAssessment = useCallback(async (cycleId: string) => {
    if (!cycleId || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: cycle }, { data: stats }] = await Promise.all([
        fetchCycleById(cycleId),
        fetchReportsWithStats(),
      ]);
      if (!cycle) {
        setError("Cycle not found");
        return;
      }
      const result = await calculateRisk(
        {
          user_profile: profileToRiskInput(profile),
          cycle: cycleToRiskInput(cycle),
          bloodwork: bloodworkToRiskInput(stats.latestReport),
          goal: cycle.goal,
        },
        user.id
      );
      setAssessment(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to calculate risk");
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      setSelectedCycleId(cycles[0].id);
    }
  }, [cycles, selectedCycleId]);

  useEffect(() => {
    if (selectedCycleId) {
      runAssessment(selectedCycleId);
    }
  }, [selectedCycleId, runAssessment]);

  useEffect(() => {
    if (!user) return;
    fetchRiskHistory(user.id, 10)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [user, assessment]);

  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);

  return (
    <div>
      <PageHeader
        title="Risk Dashboard"
        description="Educational risk scores from transparent, configurable rules. Not medical advice — does not determine safety."
        badge="Rule-Based Scoring"
        badgeVariant="warning"
        actions={
          <>
            <Link href="/risk/compare">
              <Button variant="outline" size="sm">
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
            </Link>
            <Link href="/risk/what-if">
              <Button variant="outline" size="sm">
                <FlaskConical className="h-4 w-4" />
                What-If
              </Button>
            </Link>
          </>
        }
      />

      {/* Cycle selector */}
      <Card variant="elevated" padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Select
              label="Select Cycle"
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              options={cycles.map((c) => ({ label: c.cycle_name, value: c.id }))}
              placeholder={cyclesLoading ? "Loading…" : "Choose a cycle"}
              disabled={cycles.length === 0}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => selectedCycleId && runAssessment(selectedCycleId)}
            isLoading={isLoading}
            disabled={!selectedCycleId}
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </Button>
        </div>
      </Card>

      {cycles.length === 0 && !cyclesLoading && (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-12">
            <ShieldAlert className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-4">Create a cycle to run risk assessment.</p>
            <Link href="/cycle-builder">
              <Button>Open Cycle Builder</Button>
            </Link>
          </div>
        </Card>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <p className="text-xs mt-1 text-accent/80">Ensure the FastAPI backend is running at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}</p>
          </div>
        </div>
      )}

      {isLoading && !assessment && (
        <div className="text-center py-16 animate-pulse text-muted">Calculating educational risk scores…</div>
      )}

      {assessment && (
        <div className="space-y-8 animate-fade-slide-up">
          {/* Overall + cycle summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="elevated" padding="lg" className="lg:col-span-1 flex flex-col items-center justify-center">
              <p className="text-xs text-muted uppercase tracking-wider mb-4">Overall Monitoring Priority</p>
              <RiskGauge
                score={assessment.overall_score}
                level={assessment.overall_level}
                size="lg"
              />
              <Badge variant="default" className="mt-4">
                {assessment.triggered_rules_count} rules triggered
              </Badge>
            </Card>

            <Card variant="gradient" padding="lg" className="lg:col-span-2">
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Cycle Summary
              </h3>
              {selectedCycle && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{selectedCycle.cycle_name}</Badge>
                  {selectedCycle.goal && <Badge variant="default">{selectedCycle.goal}</Badge>}
                  <Badge variant="info">{selectedCycle.compound_count} compounds</Badge>
                </div>
              )}
              <p className="text-sm text-muted leading-relaxed">{assessment.summary}</p>

              {assessment.monitoring_recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Monitoring Placeholders
                  </p>
                  <ul className="space-y-1.5">
                    {assessment.monitoring_recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          {/* Category grid */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Risk Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {assessment.categories
                .filter((c) => c.score > 0 || c.triggered_rules.length > 0)
                .sort((a, b) => b.score - a.score)
                .map((cat, i) => (
                  <CategoryRiskCard key={cat.category} category={cat} index={i} />
                ))}
            </div>
          </div>

          {history.length > 0 && (
            <Card variant="bordered" padding="md">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Risk History
              </h3>
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0"
                  >
                    <div>
                      <span className="text-foreground capitalize">{entry.assessment_type.replace("_", " ")}</span>
                      <span className="text-muted text-xs ml-2">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.overall_score != null && (
                      <Badge variant="secondary">{Math.round(entry.overall_score)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <p className="text-xs text-muted/70 text-center border-t border-border/30 pt-6">
            {assessment.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
