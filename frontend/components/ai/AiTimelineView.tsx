"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiExpandableSection } from "./AiExpandableSection";
import { AiSourceList } from "./AiSourceList";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserCycles } from "@/hooks/useUserCycles";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { fetchCycleById } from "@/services/cycles";
import { fetchRiskHistory } from "@/services/risk";
import { generateTimeline } from "@/services/ai";
import {
  cycleToAiContext,
  profileToAiContext,
  reportToAiContext,
  riskHistoryToContext,
} from "@/lib/ai/transform";
import type { AiTimelineResult } from "@/types/ai";
import { cn } from "@/utils/cn";

const EVENT_COLORS: Record<string, string> = {
  cycle: "border-primary/40 bg-primary/10",
  bloodwork: "border-secondary/40 bg-secondary/10",
  risk: "border-amber-500/40 bg-amber-500/10",
};

export function AiTimelineView() {
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const { cycles } = useUserCycles();
  const [result, setResult] = useState<AiTimelineResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: stats }, riskHist] = await Promise.all([
        fetchReportsWithStats(),
        fetchRiskHistory(user.id, 10),
      ]);

      const cycleDetails = await Promise.all(
        cycles.slice(0, 5).map((c) => fetchCycleById(c.id))
      );
      const fullCycles = cycleDetails.map((r) => r.data).filter(Boolean);
      const current = fullCycles[0] ? cycleToAiContext(fullCycles[0]!) : null;
      const previous = fullCycles.slice(1).map((c) => cycleToAiContext(c!));

      const allReports = [stats.latestReport, ...stats.previousReports].filter(
        (r): r is NonNullable<typeof stats.latestReport> => r != null
      );

      const reports = allReports.slice(0, 8).map((r) => reportToAiContext(r));

      const timeline = await generateTimeline(
        {
          profile: profileToAiContext(profile),
          current_cycle: current,
          previous_cycles: previous,
          bloodwork_reports: reports,
          risk_history: riskHistoryToContext(riskHist),
        },
        session?.access_token
      );
      setResult(timeline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate timeline");
    } finally {
      setIsLoading(false);
    }
  }, [user, session, profile, cycles]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="AI Health Timeline"
        description="Chronological educational summary of your cycles, bloodwork, and risk history."
        badge="Educational Only"
        badgeVariant="warning"
        actions={
          <Button variant="outline" size="sm" onClick={load} isLoading={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error && <p className="text-sm text-accent mb-4" role="alert">{error}</p>}

      {isLoading && !result && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Building timeline…
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-slide-up">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
            <div className="space-y-4">
              {result.events.map((event, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-2.5 top-3 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <Card
                    variant="bordered"
                    padding="md"
                    className={cn("border", EVENT_COLORS[event.event_type] ?? "")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="default" size="sm" className="mb-2 capitalize">{event.event_type}</Badge>
                        <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted mt-1">{event.description}</p>
                      </div>
                      <span className="text-xs text-muted flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {result.trend_summaries.length > 0 && (
            <AiExpandableSection title="Trend Summaries" defaultOpen>
              <ul className="space-y-2">
                {result.trend_summaries.map((t, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </AiExpandableSection>
          )}

          {result.educational_observations.length > 0 && (
            <AiExpandableSection title="Educational Observations">
              <ul className="space-y-1.5">
                {result.educational_observations.map((o, i) => (
                  <li key={i} className="text-sm text-muted">• {o}</li>
                ))}
              </ul>
            </AiExpandableSection>
          )}

          <AiSourceList articles={result.related_articles} references={result.scientific_references} />
          <AiDisclaimer text={result.disclaimer} />
        </div>
      )}
    </div>
  );
}
