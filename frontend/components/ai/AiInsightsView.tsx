"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Loader2, RefreshCw, AlertCircle, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card } from "@/components/ui";
import { fetchAiReportConfig } from "@/services/ai-cycle-report";
import { generateInsightsViaApi } from "@/services/ai-insights";
import { InsightsDashboard } from "./insights/InsightsDashboard";
import type { AiInsightsDashboard } from "@/types/ai-insights";

type PageState =
  | "loading"
  | "no_bloodwork"
  | "setup"
  | "error"
  | "ready";

export function AiInsightsView() {
  const [dashboard, setDashboard] = useState<AiInsightsDashboard | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAiReportConfig().then(({ configured, setupInstructions }) => {
      setAiConfigured(configured);
      if (!configured) setSetupMessage(setupInstructions);
    });
  }, []);

  const load = useCallback(async () => {
    setPageState("loading");
    setErrorMessage(null);

    if (aiConfigured === false) {
      setPageState("setup");
      return;
    }

    try {
      const outcome = await generateInsightsViaApi();

      if (outcome.setupRequired && outcome.data) {
        setSetupMessage(outcome.setupMessage);
        setDashboard(outcome.data);
        setPageState("ready");
        return;
      }

      if (outcome.setupRequired) {
        setSetupMessage(outcome.setupMessage);
        setPageState("setup");
        setDashboard(null);
        return;
      }

      if (outcome.noBloodwork) {
        setErrorMessage(outcome.error ?? "No bloodwork available.");
        setPageState("no_bloodwork");
        setDashboard(null);
        return;
      }

      if (outcome.error || !outcome.data) {
        console.error("[AiInsightsView]", outcome.error);
        setErrorMessage(outcome.error ?? "Unable to generate AI report. Please try again.");
        setPageState("error");
        setDashboard(null);
        return;
      }

      setDashboard(outcome.data);
      setPageState("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to generate AI report. Please try again.";
      console.error("[AiInsightsView] unexpected error", e);
      setErrorMessage(msg);
      setPageState("error");
    }
  }, [aiConfigured]);

  useEffect(() => {
    if (aiConfigured === null) return;
    void load();
  }, [aiConfigured, load]);

  return (
    <div>
      <PageHeader
        title="AI Health Intelligence"
        description="Premium educational analysis across your bloodwork, cycles, trends, and health profile."
        badge="Flagship"
        badgeVariant="warning"
        actions={
          <Button variant="outline" size="sm" onClick={load} isLoading={pageState === "loading"} disabled={pageState === "loading"}>
            <RefreshCw className="h-4 w-4" />
            Refresh Analysis
          </Button>
        }
      />

      {pageState === "loading" && (
        <Card variant="elevated" padding="lg">
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Loading AI Analysis…</p>
            <p className="text-xs text-muted">Aggregating bloodwork, cycles, and health data from Supabase</p>
          </div>
        </Card>
      )}

      {pageState === "setup" && setupMessage && (
        <Card variant="bordered" padding="lg" className="border-secondary/30 bg-secondary/5">
          <div className="flex items-start gap-3">
            <Brain className="h-6 w-6 text-secondary shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-foreground mb-2">AI not configured</h2>
              <p className="text-sm text-muted whitespace-pre-line">{setupMessage}</p>
            </div>
          </div>
        </Card>
      )}

      {pageState === "no_bloodwork" && (
        <Card variant="bordered" padding="lg">
          <div className="text-center py-12">
            <Upload className="h-10 w-10 text-muted mx-auto mb-3" />
            <h2 className="text-base font-semibold text-foreground mb-2">No bloodwork available</h2>
            <p className="text-sm text-muted mb-4 max-w-md mx-auto">
              {errorMessage ?? "Upload at least one bloodwork report with marker results to generate AI insights."}
            </p>
            <Link href="/bloodwork/entry">
              <Button>Add Bloodwork</Button>
            </Link>
          </div>
        </Card>
      )}

      {pageState === "error" && (
        <Card variant="bordered" padding="lg" className="border-accent/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Unable to generate AI report</h2>
                <p className="text-sm text-muted mt-1">{errorMessage}</p>
              </div>
              <Button size="sm" onClick={load}>
                Please try again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {pageState === "ready" && dashboard && (
        <>
          {setupMessage && (
            <Card variant="bordered" padding="md" className="mb-6 border-secondary/30 bg-secondary/5">
              <p className="text-sm text-muted whitespace-pre-line">{setupMessage}</p>
            </Card>
          )}
          <InsightsDashboard data={dashboard} onRegenerate={load} isLoading={false} />
        </>
      )}
    </div>
  );
}
