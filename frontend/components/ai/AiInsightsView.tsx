"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Loader2, RefreshCw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiSourceList } from "./AiSourceList";
import { AiUnavailableNotice, assertAiAvailable } from "./AiUnavailableNotice";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { fetchRiskHistory } from "@/services/risk";
import { generateInsights } from "@/services/ai";
import { profileToAiContext, riskHistoryToContext } from "@/lib/ai/transform";
import type { AiInsightsResult } from "@/types/ai";

function TrendIcon({ direction }: { direction?: string | null }) {
  if (direction === "up") return <TrendingUp className="h-4 w-4 text-secondary" />;
  if (direction === "down") return <TrendingDown className="h-4 w-4 text-primary" />;
  return <Minus className="h-4 w-4 text-muted" />;
}

export function AiInsightsView() {
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const [result, setResult] = useState<AiInsightsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      assertAiAvailable();
      const [{ data: stats }, riskHist] = await Promise.all([
        fetchReportsWithStats(),
        fetchRiskHistory(user.id, 10),
      ]);

      const trends = [stats.latestReport, ...stats.previousReports]
        .filter((r): r is NonNullable<typeof stats.latestReport> => r != null)
        .flatMap((r) =>
          r.bloodwork_results.map((br) => ({
            marker_name: br.marker_name,
            collection_date: r.collection_date,
            result_value: Number(br.result_value),
            unit: br.unit,
            status: br.status,
          }))
        );

      const insights = await generateInsights(
        {
          profile: profileToAiContext(profile),
          bloodwork_trends: trends,
          risk_history: riskHistoryToContext(riskHist),
        },
        session?.access_token
      );
      setResult(insights);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  }, [user, session, profile]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Factual educational observations from your bloodwork trends and risk history."
        badge="No Diagnoses"
        badgeVariant="warning"
        actions={
          <Button variant="outline" size="sm" onClick={load} isLoading={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <AiUnavailableNotice />

      {error && <p className="text-sm text-accent mb-4" role="alert">{error}</p>}

      {isLoading && !result && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Analyzing trends…
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-fade-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.insights.map((insight, i) => (
              <Card
                key={i}
                variant="gradient"
                padding="md"
                className="border border-border/40 animate-fade-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/15">
                    <Lightbulb className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendIcon direction={insight.trend_direction} />
                      {insight.marker_name && (
                        <Badge variant="default" size="sm">{insight.marker_name}</Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <AiSourceList articles={result.related_articles} references={result.scientific_references} />
          <AiDisclaimer text={result.disclaimer} />
        </div>
      )}
    </div>
  );
}
