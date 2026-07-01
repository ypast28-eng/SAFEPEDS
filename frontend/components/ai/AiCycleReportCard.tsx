"use client";

import { useCallback, useState } from "react";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiExpandableSection } from "./AiExpandableSection";
import { AiSourceList } from "./AiSourceList";
import { AiUnavailableNotice, assertAiAvailable } from "./AiUnavailableNotice";
import { useAuth } from "@/hooks/useAuth";
import { generateCycleReport } from "@/services/ai";
import type { AiCycleReportRequest, AiCycleReportResult } from "@/types/ai";

interface AiCycleReportCardProps {
  request: AiCycleReportRequest;
  compact?: boolean;
}

export function AiCycleReportCard({ request, compact = false }: AiCycleReportCardProps) {
  const { session } = useAuth();
  const [report, setReport] = useState<AiCycleReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      assertAiAvailable();
      const result = await generateCycleReport(request, session?.access_token);
      setReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setIsLoading(false);
    }
  }, [request, session?.access_token]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-secondary" />
          {!compact && <h2 className="text-base font-semibold text-foreground">AI Cycle Report</h2>}
          <Badge variant="warning" size="sm">Educational</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={generate} isLoading={isLoading}>
          {report ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {report ? "Regenerate" : "Generate"}
        </Button>
      </div>

      <AiUnavailableNotice />

      {error && <p className="text-sm text-accent" role="alert">{error}</p>}

      {isLoading && !report && (
        <div className="flex items-center gap-2 py-8 text-muted text-sm animate-pulse justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating…
        </div>
      )}

      {report && (
        <div className="space-y-3 animate-fade-slide-up">
          <AiExpandableSection title="Compound Summary" defaultOpen>
            <p className="text-sm text-muted">{report.compound_summary}</p>
          </AiExpandableSection>
          <AiExpandableSection title="Duration">
            <p className="text-sm text-muted">{report.duration_summary}</p>
          </AiExpandableSection>
          <AiExpandableSection title="Risk Score Explanation" defaultOpen>
            <p className="text-sm text-muted leading-relaxed">{report.risk_explanation}</p>
          </AiExpandableSection>
          {report.relevant_markers.length > 0 && (
            <AiExpandableSection title="Relevant Markers to Discuss">
              <div className="flex flex-wrap gap-2">
                {report.relevant_markers.map((m) => (
                  <Badge key={m} variant="info" size="sm">{m}</Badge>
                ))}
              </div>
            </AiExpandableSection>
          )}
          {report.monitoring_priorities.length > 0 && (
            <AiExpandableSection title="Monitoring Priorities">
              <ul className="space-y-1">
                {report.monitoring_priorities.map((p, i) => (
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
