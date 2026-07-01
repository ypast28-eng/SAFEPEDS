"use client";

import { useState } from "react";
import { Chart } from "@/components/ui/Chart";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { useBloodworkHistory } from "@/hooks/useBloodworkHistory";
import { TREND_MARKER_NAMES, type TrendTimeRange } from "@/types/bloodwork";
import { cn } from "@/utils/cn";
import type { ChartDataPoint } from "@/types";

const TIME_RANGES: { label: string; value: TrendTimeRange }[] = [
  { label: "3 months", value: "3m" },
  { label: "6 months", value: "6m" },
  { label: "12 months", value: "12m" },
  { label: "All time", value: "all" },
];

export function TrendDashboard() {
  const [selectedMarker, setSelectedMarker] = useState<string>(TREND_MARKER_NAMES[0]);
  const [range, setRange] = useState<TrendTimeRange>("12m");
  const { history, isLoading } = useBloodworkHistory(selectedMarker, range);

  const chartData: ChartDataPoint[] = history.map((h) => ({
    label: new Date(h.collection_date + "T00:00:00").toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    value: Number(h.result_value),
  }));

  const unit = history[0]?.unit ?? "";

  return (
    <div className="space-y-6">
      {/* Marker selector */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">Marker</p>
        <div className="flex flex-wrap gap-2">
          {TREND_MARKER_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedMarker(name)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                selectedMarker === name
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface text-muted border-border hover:border-primary/30"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Time range */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-2">Time Range</p>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              type="button"
              onClick={() => setRange(tr.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                range === tr.value
                  ? "bg-secondary/15 text-secondary border-secondary/30"
                  : "bg-surface text-muted border-border hover:border-secondary/30"
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <Card variant="elevated" padding="md">
        <CardHeader>
          <CardTitle>{selectedMarker} Trend</CardTitle>
          <CardDescription>
            {unit ? `Unit: ${unit}` : "Historical values from your logged reports"}
          </CardDescription>
        </CardHeader>
        {isLoading ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-sm text-muted animate-pulse">Loading trend data…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted">No data for this marker in the selected range.</p>
            <p className="text-xs text-muted/70 mt-1">Log bloodwork to see trends over time.</p>
          </div>
        ) : (
          <Chart type="area" data={chartData} height={280} />
        )}
      </Card>

      {/* Data points list */}
      {history.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-sm font-semibold text-foreground mb-3">Data Points</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...history].reverse().map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0"
              >
                <span className="text-muted">
                  {new Date(h.collection_date + "T00:00:00").toLocaleDateString()}
                </span>
                <span className="font-medium text-foreground">
                  {h.result_value} {h.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
