"use client";

import { Card } from "@/components/ui";
import type { MarkerTrendTimeline } from "@/types/ai-insights";

export function TrendTimelineSection({ timelines }: { timelines: MarkerTrendTimeline[] }) {
  if (timelines.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Trend Timeline</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {timelines.map((t) => {
          const values = t.points.map((p) => p.value);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const span = max - min || 1;

          return (
            <Card key={t.marker_name} variant="bordered" padding="md">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {t.marker_name} <span className="text-muted font-normal">({t.unit})</span>
              </h3>
              <div className="flex items-end gap-2 h-24 mb-3">
                {t.points.map((p, i) => {
                  const height = ((p.value - min) / span) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary/60 min-h-[4px]"
                        style={{ height: `${Math.max(8, height)}%` }}
                        title={`${p.value} on ${p.date}`}
                      />
                      <span className="text-[10px] text-muted text-center leading-tight">
                        {p.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted leading-relaxed">{t.analysis}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
