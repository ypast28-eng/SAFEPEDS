"use client";

import { Card, Badge } from "@/components/ui";
import { RiskGauge } from "./RiskGauge";
import type { CompoundRiskOutput } from "@/types/risk";
import { RISK_LEVEL_BG, RISK_LEVEL_COLORS } from "@/types/risk";

interface CompoundRiskListProps {
  compounds: CompoundRiskOutput[];
}

export function CompoundRiskList({ compounds }: CompoundRiskListProps) {
  if (compounds.length === 0) {
    return (
      <Card variant="bordered" padding="lg">
        <p className="text-sm text-muted text-center py-6">
          No compounds in this cycle. Add compounds in Cycle Builder to assess educational risks.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {compounds.map((compound) => (
        <Card
          key={compound.compound_id}
          variant="gradient"
          padding="md"
          className={RISK_LEVEL_BG[compound.level]}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{compound.compound_name}</h3>
              <p className="text-xs text-muted mt-1">
                {compound.weekly_dose} {compound.unit}/wk · {compound.frequency_per_week}x/week ·{" "}
                {compound.duration_weeks} weeks
              </p>
            </div>
            <RiskGauge score={compound.score} level={compound.level} size="sm" />
          </div>

          <p className={`text-xs font-semibold mb-2 ${RISK_LEVEL_COLORS[compound.level]}`}>
            {compound.level} · {compound.score}/100
          </p>

          {compound.reasons.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Triggered Risk Reasons
              </p>
              <ul className="space-y-1">
                {compound.reasons.map((reason) => (
                  <li key={reason} className="text-xs text-muted flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {compound.monitoring_markers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Key Monitoring Markers
              </p>
              <div className="flex flex-wrap gap-1.5">
                {compound.monitoring_markers.map((marker) => (
                  <Badge key={marker} variant="default">
                    {marker}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
