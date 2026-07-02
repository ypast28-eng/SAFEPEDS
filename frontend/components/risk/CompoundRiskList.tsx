"use client";

import { Card, Badge } from "@/components/ui";
import type { CompoundRiskHighlight } from "@/lib/risk/compound-insights";
import { RISK_LEVEL_COLORS } from "@/types/risk";

interface CompoundRiskListProps {
  compounds: CompoundRiskHighlight[];
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
        <Card key={compound.compound_id} variant="gradient" padding="md">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{compound.name}</h3>
              <p className="text-xs text-muted mt-1">
                {compound.weekly_dose} {compound.unit}/wk · {compound.frequency_per_week}x/week ·{" "}
                {compound.duration_weeks} weeks
              </p>
            </div>
            {compound.category && <Badge variant="default">{compound.category}</Badge>}
          </div>
          <ul className="space-y-1.5">
            {compound.flags.map((flag) => (
              <li key={flag} className="text-xs text-muted flex items-start gap-2">
                <span className={`mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0`} />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
          {compound.administration && (
            <p className={`text-xs mt-3 ${RISK_LEVEL_COLORS.Low}`}>
              Route: {compound.administration}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
