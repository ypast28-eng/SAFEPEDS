"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Select, Input, Badge } from "@/components/ui";
import { RiskGauge } from "./RiskGauge";
import { CompoundLibrary } from "@/components/cycles/CompoundLibrary";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserCycles } from "@/hooks/useUserCycles";
import { fetchCycleById } from "@/services/cycles";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { whatIfAnalysis } from "@/services/risk";
import {
  bloodworkToRiskInput,
  buildCycleInputFromDraft,
  cycleToRiskInput,
  profileToRiskInput,
} from "@/lib/risk/transform";
import type { CycleCompoundInput, CycleInput, WhatIfResult } from "@/types/risk";
import type { CompoundWithRelations } from "@/types/compounds";

interface WhatIfCompound extends CycleCompoundInput {
  localId: string;
}

export function WhatIfView() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cycles } = useUserCycles();
  const [baseCycleId, setBaseCycleId] = useState("");
  const [baseInput, setBaseInput] = useState<CycleInput | null>(null);
  const [whatIfCompounds, setWhatIfCompounds] = useState<WhatIfCompound[]>([]);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = cycles.map((c) => ({ label: c.cycle_name, value: c.id }));

  useEffect(() => {
    async function loadBase() {
      if (!baseCycleId) return;
      const { data } = await fetchCycleById(baseCycleId);
      if (data) {
        const input = cycleToRiskInput(data);
        setBaseInput(input);
        setWhatIfCompounds(
          input.compounds.map((c) => ({
            ...c,
            localId: crypto.randomUUID(),
          }))
        );
        setResult(null);
      }
    }
    loadBase();
  }, [baseCycleId]);

  const selectedIds = useMemo(
    () => new Set(whatIfCompounds.map((c) => c.compound_id)),
    [whatIfCompounds]
  );

  const handleAddCompound = (compound: CompoundWithRelations) => {
    setWhatIfCompounds((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        compound_id: compound.id,
        name: compound.name,
        category: compound.category?.name ?? null,
        compound_type: compound.compound_type,
        administration: compound.administration,
        weekly_dose: 0,
        unit: "mg",
        frequency_per_week: 2,
        duration_weeks: 12,
        profile: compound.profile
          ? {
              liver_toxicity: compound.profile.liver_toxicity,
              kidney_toxicity: compound.profile.kidney_toxicity,
              cardiovascular_toxicity: compound.profile.cardiovascular_toxicity,
              lipid_impact: compound.profile.lipid_impact,
              hematocrit_impact: compound.profile.hematocrit_impact,
              blood_pressure_impact: compound.profile.blood_pressure_impact,
              estrogenic_activity: compound.profile.estrogenic_activity,
              androgenic_activity: compound.profile.androgenic_activity,
              prolactin_activity: compound.profile.prolactin_activity,
            }
          : null,
      },
    ]);
  };

  const updateCompound = (localId: string, patch: Partial<WhatIfCompound>) => {
    setWhatIfCompounds((prev) =>
      prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c))
    );
  };

  const removeCompound = (localId: string) => {
    setWhatIfCompounds((prev) => prev.filter((c) => c.localId !== localId));
  };

  const runWhatIf = useCallback(async () => {
    if (!user || !baseInput) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: stats } = await fetchReportsWithStats();
      const modified = buildCycleInputFromDraft(baseInput, whatIfCompounds);
      const whatIfResult = await whatIfAnalysis(
        {
          user_profile: profileToRiskInput(profile),
          base_cycle: baseInput,
          modified_cycle: modified,
          bloodwork: bloodworkToRiskInput(stats.latestReport),
        },
        user.id,
        false
      );
      setResult(whatIfResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "What-if analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, baseInput, whatIfCompounds]);

  return (
    <div>
      <PageHeader
        title="What-If Analysis"
        description="Duplicate a cycle, modify compounds or doses, and recalculate educational risk instantly."
        badge="Instant Recalculation"
        actions={
          <Link href="/risk">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Risk Dashboard
            </Button>
          </Link>
        }
      />

      <Card variant="elevated" padding="md" className="mb-6">
        <Select
          label="Base Cycle"
          value={baseCycleId}
          onChange={(e) => setBaseCycleId(e.target.value)}
          options={options}
          placeholder="Select cycle to modify"
        />
      </Card>

      {baseInput && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
          <div className="xl:col-span-2">
            <CompoundLibrary onSelect={handleAddCompound} selectedIds={selectedIds} />
          </div>
          <div className="xl:col-span-3 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-secondary" />
                Modified Stack ({whatIfCompounds.length})
              </h3>
              <Button size="sm" onClick={runWhatIf} isLoading={isLoading}>
                <RefreshCw className="h-4 w-4" />
                Recalculate
              </Button>
            </div>
            {whatIfCompounds.map((c) => (
              <Card key={c.localId} variant="bordered" padding="md">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    {c.category && <Badge variant="default" size="sm" className="mt-1">{c.category}</Badge>}
                  </div>
                  <button type="button" onClick={() => removeCompound(c.localId)} className="text-muted hover:text-accent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Weekly Dose"
                    type="number"
                    value={c.weekly_dose || ""}
                    onChange={(e) => updateCompound(c.localId, { weekly_dose: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Freq/wk"
                    type="number"
                    value={c.frequency_per_week}
                    onChange={(e) => updateCompound(c.localId, { frequency_per_week: parseInt(e.target.value, 10) || 1 })}
                  />
                  <Input
                    label="Weeks"
                    type="number"
                    value={c.duration_weeks}
                    onChange={(e) => updateCompound(c.localId, { duration_weeks: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </Card>
            ))}
            {whatIfCompounds.length === 0 && (
              <Card variant="bordered" padding="md">
                <p className="text-sm text-muted text-center py-6">Add compounds from the library to build your what-if stack.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-slide-up">
          <p className="text-sm text-muted text-center">{result.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="gradient" padding="lg" className="text-center">
              <Badge variant="default" className="mb-3">Base</Badge>
              <RiskGauge
                score={result.base_assessment.overall_score}
                level={result.base_assessment.overall_level}
                size="md"
              />
            </Card>
            <Card variant="gradient" padding="lg" className="text-center">
              <Badge variant="primary" className="mb-3">Modified</Badge>
              <RiskGauge
                score={result.modified_assessment.overall_score}
                level={result.modified_assessment.overall_level}
                size="md"
              />
            </Card>
          </div>
          <Card variant="elevated" padding="lg">
            <h3 className="text-sm font-semibold text-foreground mb-3">Score Changes by Category</h3>
            <div className="space-y-2">
              {result.category_comparisons
                .filter((c) => c.score_delta !== 0)
                .sort((a, b) => Math.abs(b.score_delta) - Math.abs(a.score_delta))
                .map((c) => (
                  <div key={c.category} className="flex justify-between text-sm py-1.5 border-b border-border/20">
                    <span className="text-muted">{c.category_name}</span>
                    <span className={c.score_delta > 0 ? "text-secondary font-medium" : "text-primary font-medium"}>
                      {c.score_delta > 0 ? "+" : ""}{c.score_delta}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
          <p className="text-xs text-muted/70 text-center">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
