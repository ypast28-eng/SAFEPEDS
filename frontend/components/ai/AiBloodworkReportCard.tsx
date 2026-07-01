"use client";

import { useCallback, useState } from "react";
import { Brain, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiExpandableSection } from "./AiExpandableSection";
import { AiSourceList } from "./AiSourceList";
import { AiUnavailableNotice, assertAiAvailable } from "./AiUnavailableNotice";
import { useAuth } from "@/hooks/useAuth";
import { generateBloodworkReport } from "@/services/ai";
import type { AiBloodworkReportRequest, AiBloodworkReportResult } from "@/types/ai";

interface AiBloodworkReportCardProps {
  request: AiBloodworkReportRequest;
}

export function AiBloodworkReportCard({ request }: AiBloodworkReportCardProps) {
  const { session } = useAuth();
  const [report, setReport] = useState<AiBloodworkReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      assertAiAvailable();
      const result = await generateBloodworkReport(request, session?.access_token);
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
          <h2 className="text-base font-semibold text-foreground">AI Educational Report</h2>
          <Badge variant="warning" size="sm">Educational Only</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={generate} isLoading={isLoading}>
          {report ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {report ? "Regenerate" : "Generate Report"}
        </Button>
      </div>

      <AiUnavailableNotice />

      {error && (
        <p className="text-sm text-accent" role="alert">{error}</p>
      )}

      {isLoading && !report && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating educational analysis…
        </div>
      )}

      {report && (
        <div className="space-y-4 animate-fade-slide-up">
          <AiExpandableSection title="Overview">
            <p className="text-sm text-muted leading-relaxed">{report.overview}</p>
          </AiExpandableSection>

          {report.normal_markers.length > 0 && (
            <AiExpandableSection title="Markers Within Reference Range" badge={String(report.normal_markers.length)}>
              <div className="flex flex-wrap gap-2">
                {report.normal_markers.map((m) => (
                  <Badge key={m} variant="primary" size="sm">{m}</Badge>
                ))}
              </div>
            </AiExpandableSection>
          )}

          {report.out_of_range_markers.length > 0 && (
            <AiExpandableSection title="Markers Outside Reference Range" badge={String(report.out_of_range_markers.length)} defaultOpen>
              <div className="space-y-3">
                {report.out_of_range_markers.map((m) => (
                  <div key={m.marker_name} className="rounded-lg bg-surface/80 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      {m.marker_name}: {m.result_value} {m.unit}
                      <span className="text-secondary ml-2">({m.status})</span>
                    </p>
                    {m.reference_range && (
                      <p className="text-xs text-muted mt-0.5">Ref: {m.reference_range}</p>
                    )}
                    <p className="text-xs text-muted mt-1">{m.educational_note}</p>
                  </div>
                ))}
              </div>
            </AiExpandableSection>
          )}

          <AiExpandableSection title="Historical Comparison">
            <p className="text-sm text-muted leading-relaxed">{report.historical_comparison}</p>
          </AiExpandableSection>

          {report.monitoring_considerations.length > 0 && (
            <AiExpandableSection title="Monitoring Considerations">
              <ul className="space-y-1.5">
                {report.monitoring_considerations.map((item, i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <span className="text-primary">•</span>{item}
                  </li>
                ))}
              </ul>
            </AiExpandableSection>
          )}

          <AiSourceList
            articles={report.related_articles}
            references={report.scientific_references}
          />

          <AiDisclaimer text={report.disclaimer} />
        </div>
      )}
    </div>
  );
}
