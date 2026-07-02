"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Loader2, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiExpandableSection } from "./AiExpandableSection";
import { AiSourceList } from "./AiSourceList";
import { fetchAiReportConfig, generateCycleReportViaApi } from "@/services/ai-cycle-report";
import type { AiCycleReportRequest, AiCycleReportResult } from "@/types/ai";

interface AiCycleReportCardProps {
  request: AiCycleReportRequest;
  cycleId?: string;
  compact?: boolean;
}

export function AiCycleReportCard({ request, cycleId, compact = false }: AiCycleReportCardProps) {
  const [report, setReport] = useState<AiCycleReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAiReportConfig().then(({ configured, setupInstructions }) => {
      setAiConfigured(configured);
      setSetupMessage(configured ? null : setupInstructions);
    });
  }, []);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const outcome = cycleId
        ? await generateCycleReportViaApi({ cycleId })
        : await generateCycleReportViaApi({ request });

      if (outcome.setupRequired) {
        setSetupMessage(outcome.setupMessage);
        setReport(null);
        return;
      }

      if (outcome.error || !outcome.data) {
        setError(outcome.error ?? "Failed to generate report");
        return;
      }

      setReport(outcome.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  }, [request, cycleId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-secondary" />
          {!compact && <h2 className="text-base font-semibold text-foreground">AI Cycle Report</h2>}
          <Badge variant="warning" size="sm">Educational</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          isLoading={isLoading}
          disabled={aiConfigured === false}
        >
          {report ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {report ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {aiConfigured === false && setupMessage && (
        <Card variant="bordered" padding="md" className="border-secondary/30 bg-secondary/5">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-secondary shrink-0" />
            <p className="text-sm text-muted whitespace-pre-line">{setupMessage}</p>
          </div>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading && !report && (
        <div className="flex items-center gap-2 py-8 text-muted text-sm animate-pulse justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating educational cycle report from your saved cycle and risk scores…
        </div>
      )}

      {report && (
        <div className="space-y-3 animate-fade-slide-up">
          <AiExpandableSection title="Overall Risk Summary" defaultOpen>
            <p className="text-sm text-muted leading-relaxed">{report.overall_risk_summary}</p>
          </AiExpandableSection>

          {report.highest_risk_categories.length > 0 && (
            <AiExpandableSection title="Highest Risk Categories" defaultOpen>
              <div className="space-y-2">
                {report.highest_risk_categories.map((cat) => (
                  <div key={cat.category_name} className="rounded-lg bg-surface/80 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {cat.category_name}{" "}
                      <span className="text-secondary">({cat.level} · {cat.score})</span>
                    </p>
                    <p className="text-xs text-muted mt-1">{cat.explanation}</p>
                  </div>
                ))}
              </div>
            </AiExpandableSection>
          )}

          <AiExpandableSection title="Compound Summary" defaultOpen>
            <p className="text-sm text-muted">{report.compound_summary}</p>
          </AiExpandableSection>

          {report.compound_concerns.length > 0 && (
            <AiExpandableSection title="Compound-Specific Concerns" defaultOpen>
              <div className="space-y-3">
                {report.compound_concerns.map((item) => (
                  <div key={item.compound_name} className="rounded-lg bg-surface/80 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{item.compound_name}</p>
                    <ul className="mt-1 space-y-1">
                      {item.concerns.map((concern) => (
                        <li key={concern} className="text-xs text-muted flex gap-2">
                          <span className="text-primary">•</span>
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AiExpandableSection>
          )}

          <AiExpandableSection title="Duration">
            <p className="text-sm text-muted">{report.duration_summary}</p>
          </AiExpandableSection>

          <AiExpandableSection title="Risk Score Explanation">
            <p className="text-sm text-muted leading-relaxed">{report.risk_explanation}</p>
          </AiExpandableSection>

          {report.bloodwork_markers_to_monitor.length > 0 && (
            <AiExpandableSection title="Bloodwork Markers to Monitor" defaultOpen>
              <div className="flex flex-wrap gap-2">
                {report.bloodwork_markers_to_monitor.map((m) => (
                  <Badge key={m} variant="info" size="sm">{m}</Badge>
                ))}
              </div>
            </AiExpandableSection>
          )}

          {report.harm_reduction_suggestions.length > 0 && (
            <AiExpandableSection title="Harm-Reduction Style Suggestions" defaultOpen>
              <ul className="space-y-1">
                {report.harm_reduction_suggestions.map((p, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-primary">•</span>{p}
                  </li>
                ))}
              </ul>
            </AiExpandableSection>
          )}

          <AiSourceList articles={report.related_articles} references={report.scientific_references} />
          <AiDisclaimer text={report.disclaimer} />
        </div>
      )}
    </div>
  );
}
