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
import { CompoundRiskList } from "./CompoundRiskList";
import { AiCycleReportCard } from "@/components/ai";
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
import {
  buildCompoundRiskHighlights,
  pickDefaultCycleId,
} from "@/lib/risk/compound-insights";
import {
  cycleToAiContext,
  profileToAiContext,
  riskToAiContext,
} from "@/lib/ai/transform";
import type { RiskAssessmentResult, RiskHistoryEntry } from "@/types/risk";
import type { UserCycleWithCompounds } from "@/types/cycles";

export function RiskDashboardView() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cycles, isLoading: cyclesLoading, error: cyclesError } = useUserCycles();
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [assessment, setAssessment] = useState<RiskAssessmentResult | null>(null);
  const [rulesSource, setRulesSource] = useState<string | null>(null);
  const [cycleDetail, setCycleDetail] = useState<UserCycleWithCompounds | null>(null);
  const [history, setHistory] = useState<RiskHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAssessment = useCallback(
    async (cycleId: string) => {
      if (!cycleId || !user) return;
      setIsLoading(true);
      setError(null);
      try {
        const [{ data: cycle, error: cycleError }, { data: stats }] = await Promise.all([
          fetchCycleById(cycleId),
          fetchReportsWithStats(),
        ]);

        if (cycleError) {
          setError(cycleError);
          return;
        }

        if (!cycle) {
          setError("Cycle not found");
          return;
        }

        if (cycle.cycle_compounds.length === 0) {
          setCycleDetail(cycle);
          setAssessment(null);
          setError("This cycle has no compounds yet. Add compounds in Cycle Builder before running risk assessment.");
          return;
        }

        setCycleDetail(cycle);
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
        setRulesSource(result.rules_source ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to calculate risk");
        setAssessment(null);
      } finally {
        setIsLoading(false);
      }
    },
    [user, profile]
  );

  useEffect(() => {
    if (cycles.length === 0) {
      setSelectedCycleId("");
      return;
    }
    setSelectedCycleId((current) => current || pickDefaultCycleId(cycles));
  }, [cycles]);

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
        description="Educational risk scores from your saved cycles and transparent rule-based scoring. Not medical advice — does not determine safety."
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

      <Card variant="elevated" padding="md" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Select
              label="Select saved cycle"
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              options={cycles.map((c) => ({
                label: `${c.cycle_name} (${c.compound_count} compound${c.compound_count === 1 ? "" : "s"})`,
                value: c.id,
              }))}
              placeholder={cyclesLoading ? "Loading cycles…" : "Choose a cycle"}
              disabled={cycles.length === 0 || cyclesLoading}
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
        {selectedCycle && (
          <p className="text-xs text-muted mt-3">
            Analyzing compounds, doses, duration, and overlap from your saved cycle in Supabase.
            {selectedCycle.end_date
              ? ` Planned end: ${selectedCycle.end_date}.`
              : " No end date set — treated as active/latest."}
          </p>
        )}
      </Card>

      {cyclesLoading && (
        <div className="text-center py-16 animate-pulse text-muted">Loading your saved cycles…</div>
      )}

      {cyclesError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          Could not load cycles: {cyclesError}
        </div>
      )}

      {!cyclesLoading && cycles.length === 0 && (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-12">
            <ShieldAlert className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-4">Create a cycle first.</p>
            <Link href="/cycle-builder">
              <Button>Open Cycle Builder</Button>
            </Link>
          </div>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading && !assessment && cycles.length > 0 && (
        <div className="text-center py-16 animate-pulse text-muted">
          Calculating educational risk scores from your saved cycle…
        </div>
      )}

      {assessment && cycleDetail && (
        <div className="space-y-8 animate-fade-slide-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="elevated" padding="lg" className="lg:col-span-1 flex flex-col items-center justify-center">
              <p className="text-xs text-muted uppercase tracking-wider mb-4">Overall Risk Score</p>
              <RiskGauge score={assessment.overall_score} level={assessment.overall_level} size="lg" />
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Badge variant="default">{assessment.triggered_rules_count} rules triggered</Badge>
                {rulesSource === "supabase" && <Badge variant="primary">Supabase rules</Badge>}
                {rulesSource === "fallback" && <Badge variant="secondary">Fallback rules</Badge>}
              </div>
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
                  <Badge variant="info">{cycleDetail.cycle_compounds.length} compounds</Badge>
                </div>
              )}
              <p className="text-sm text-muted leading-relaxed">{assessment.summary}</p>

              {assessment.monitoring_recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Educational Monitoring Notes
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

          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Compound-Level Risks</h2>
            <CompoundRiskList
              compounds={buildCompoundRiskHighlights(cycleToRiskInput(cycleDetail).compounds)}
            />
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Category Risk Ratings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {assessment.categories
                .sort((a, b) => b.score - a.score)
                .map((cat, i) => (
                  <CategoryRiskCard key={cat.category} category={cat} index={i} />
                ))}
            </div>
          </div>

          <Card variant="elevated" padding="lg">
            <AiCycleReportCard
              request={{
                profile: profileToAiContext(profile),
                cycle: cycleToAiContext(cycleDetail),
                risk_assessment: riskToAiContext(assessment),
              }}
            />
          </Card>

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
                      <span className="text-foreground capitalize">
                        {entry.assessment_type.replace("_", " ")}
                      </span>
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
