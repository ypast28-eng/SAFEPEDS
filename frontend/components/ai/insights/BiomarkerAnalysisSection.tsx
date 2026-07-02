"use client";

import { Card, Badge } from "@/components/ui";
import type { BiomarkerAnalysis } from "@/types/ai-insights";

export function BiomarkerAnalysisSection({ markers }: { markers: BiomarkerAnalysis[] }) {
  if (markers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Current Bloodwork Analysis</h2>
      <div className="space-y-3">
        {markers.map((m) => (
          <Card key={m.marker_name} variant="bordered" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{m.marker_name}</h3>
                <p className="text-lg font-bold text-foreground mt-1">
                  {m.current_value} <span className="text-sm font-normal text-muted">{m.unit}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">Ref: {m.reference_range}</Badge>
                <Badge variant={m.status === "Borderline" ? "warning" : m.status === "Normal" ? "success" : m.status === "Low" ? "info" : "danger"} size="sm">
                  {m.status}
                </Badge>
                <Badge variant="info" size="sm">{m.trend}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted mb-1">{m.trend_detail}</p>
            <p className="text-xs text-muted mb-1"><strong>Educational significance:</strong> {m.educational_significance}</p>
            <p className="text-xs text-muted/80"><strong>Possible associations:</strong> {m.possible_ped_associations}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
