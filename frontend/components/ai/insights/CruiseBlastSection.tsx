"use client";

import { Card, Badge } from "@/components/ui";
import type { CruiseBlastComparison } from "@/types/ai-insights";

export function CruiseBlastSection({ comparison }: { comparison: CruiseBlastComparison | null }) {
  if (!comparison) {
    return (
      <Card variant="bordered" padding="md">
        <h2 className="text-base font-semibold text-foreground mb-2">Cruise vs Blast</h2>
        <p className="text-sm text-muted">
          Log cycles classified as cruise and blast (by name, dose, or notes) with nearby bloodwork to enable comparison.
        </p>
      </Card>
    );
  }

  const { cruise_cycle, blast_cycle, marker_differences, analysis } = comparison;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Cruise vs Blast Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card variant="bordered" padding="md">
          <Badge variant="primary" size="sm" className="mb-2">Cruise</Badge>
          <h3 className="text-sm font-semibold">{cruise_cycle.cycle_name}</h3>
          <p className="text-xs text-muted mt-1">{cruise_cycle.total_weekly_mg} mg/wk total</p>
          <ul className="mt-2 space-y-1">
            {cruise_cycle.compounds.map((c) => (
              <li key={c.name} className="text-xs text-muted">{c.name}: {c.weekly_dose}{c.unit}/wk</li>
            ))}
          </ul>
        </Card>
        <Card variant="bordered" padding="md">
          <Badge variant="warning" size="sm" className="mb-2">Blast</Badge>
          <h3 className="text-sm font-semibold">{blast_cycle.cycle_name}</h3>
          <p className="text-xs text-muted mt-1">{blast_cycle.total_weekly_mg} mg/wk total</p>
          <ul className="mt-2 space-y-1">
            {blast_cycle.compounds.map((c) => (
              <li key={c.name} className="text-xs text-muted">{c.name}: {c.weekly_dose}{c.unit}/wk</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card variant="elevated" padding="md">
        <p className="text-sm text-muted mb-3">{analysis}</p>
        <div className="space-y-2">
          {marker_differences.slice(0, 8).map((d) => (
            <div key={d.marker_name} className="text-xs text-muted border-t border-border/30 pt-2">
              <strong className="text-foreground">{d.marker_name}:</strong>{" "}
              Cruise {d.cruise_value ?? "—"} → Blast {d.blast_value ?? "—"} {d.unit}. {d.note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
