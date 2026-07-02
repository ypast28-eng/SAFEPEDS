"use client";

import { AlertTriangle } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { PriorityFinding } from "@/types/ai-insights";

const SEVERITY_VARIANT = {
  Low: "default" as const,
  Moderate: "warning" as const,
  High: "danger" as const,
};

export function PriorityAlertsSection({ findings }: { findings: PriorityFinding[] }) {
  if (findings.length === 0) {
    return (
      <Card variant="bordered" padding="md">
        <p className="text-sm text-muted">No priority educational flags from your latest logged data.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-secondary" />
        Priority Findings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((f) => (
          <Card key={f.title} variant="bordered" padding="md" className="border-secondary/20">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <Badge variant={SEVERITY_VARIANT[f.severity]} size="sm">{f.severity}</Badge>
            </div>
            <p className="text-xs text-muted mb-1"><strong>Why it matters:</strong> {f.why_it_matters}</p>
            <p className="text-xs text-muted mb-1">{f.educational_explanation}</p>
            <p className="text-xs text-muted/80">{f.monitoring_advice}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
