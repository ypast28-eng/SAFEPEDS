"use client";

import { CheckCircle2, FileDown, RefreshCw, Sparkles } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { AiSourceList } from "@/components/ai/AiSourceList";
import { HealthScoreHeader } from "./HealthScoreHeader";
import { PriorityAlertsSection } from "./PriorityAlertsSection";
import { OrganSystemGrid } from "./OrganSystemGrid";
import { BiomarkerAnalysisSection } from "./BiomarkerAnalysisSection";
import { TrendTimelineSection } from "./TrendTimelineSection";
import { CruiseBlastSection } from "./CruiseBlastSection";
import type { AiInsightsDashboard } from "@/types/ai-insights";

export function InsightsDashboard({
  data,
  onRegenerate,
  isLoading,
}: {
  data: AiInsightsDashboard;
  onRegenerate: () => void;
  isLoading: boolean;
}) {
  function exportPdf() {
    window.print();
  }

  return (
    <div id="insights-dashboard" className="space-y-8 animate-fade-slide-up print:space-y-4">
      <div className="flex flex-wrap gap-2 justify-end print:hidden">
        <Button variant="outline" size="sm" onClick={onRegenerate} isLoading={isLoading}>
          <RefreshCw className="h-4 w-4" />
          Generate Report
        </Button>
        <Button variant="outline" size="sm" onClick={exportPdf}>
          <FileDown className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <HealthScoreHeader
        score={data.overall_health_score}
        label={data.health_score_label}
        explanation={data.health_score_explanation}
        riskLevel={data.risk_level}
        riskExplanation={data.risk_explanation}
      />

      <PriorityAlertsSection findings={data.priority_findings} />

      <OrganSystemGrid systems={data.organ_systems} />

      <Card variant="elevated" padding="lg">
        <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary" />
          AI Report Summary
        </h2>
        <p className="text-sm text-muted leading-relaxed">{data.summary}</p>
        {data.abnormal_findings.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Abnormal findings</h3>
            <ul className="space-y-1">
              {data.abnormal_findings.map((item) => (
                <li key={item} className="text-xs text-muted">• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <BiomarkerAnalysisSection markers={data.biomarker_analyses} />

      <TrendTimelineSection timelines={data.trend_timelines} />

      <CruiseBlastSection comparison={data.cruise_blast_comparison} />

      {data.positive_findings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Positive Findings
          </h2>
          <Card variant="bordered" padding="md" className="border-primary/20 bg-primary/5">
            <ul className="space-y-2">
              {data.positive_findings.map((p) => (
                <li key={p} className="text-sm text-muted flex gap-2">
                  <span className="text-primary">•</span>{p}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {data.compound_correlations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Compound Correlation (Educational)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.compound_correlations.map((c) => (
              <Card key={c.compound_name} variant="bordered" padding="md">
                <h3 className="text-sm font-semibold text-foreground">{c.compound_name}</h3>
                <ul className="mt-2 space-y-1">
                  {c.educational_associations.map((a) => (
                    <li key={a} className="text-xs text-muted">• {a}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-muted/70 mt-2">{c.disclaimer}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card variant="bordered" padding="md">
        <h2 className="text-sm font-semibold text-foreground mb-2">Trend Analysis</h2>
        <p className="text-sm text-muted leading-relaxed mb-3">{data.trend_analysis}</p>
        <h2 className="text-sm font-semibold text-foreground mb-2">Long-Term Trends</h2>
        <p className="text-sm text-muted leading-relaxed">{data.long_term_trends}</p>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="text-sm font-semibold text-foreground mb-2">Recommendations</h2>
        <ul className="space-y-2">
          {data.recommendations.map((r) => (
            <li key={r} className="text-sm text-muted flex gap-2">
              <span className="text-primary">•</span>{r}
            </li>
          ))}
        </ul>
      </Card>

      <AiSourceList articles={data.related_articles} references={data.scientific_references} />
      <AiDisclaimer text={data.disclaimer} />
      <p className="text-xs text-muted text-center print:block">
        This report is educational and should not replace advice from a qualified healthcare professional.
      </p>
    </div>
  );
}
