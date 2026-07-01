"use client";

import { Trash2, GripVertical } from "lucide-react";
import { Input, Select, Textarea, Badge, Button, Card } from "@/components/ui";
import { DOSE_UNITS, FREQUENCY_OPTIONS } from "@/lib/constants/cycles";
import type { CycleCompoundDraft } from "@/types/cycles";
import type { DoseUnit } from "@/lib/constants/cycles";

interface CycleCompoundCardProps {
  item: CycleCompoundDraft;
  index: number;
  onChange: (localId: string, patch: Partial<CycleCompoundDraft>) => void;
  onRemove: (localId: string) => void;
}

export function CycleCompoundCard({ item, index, onChange, onRemove }: CycleCompoundCardProps) {
  return (
    <Card
      variant="gradient"
      padding="md"
      className="animate-fade-slide-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-muted/40 hidden sm:block">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">{item.compound.name}</h4>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {item.compound.category && (
                  <Badge variant="secondary" size="sm">
                    {item.compound.category.name}
                  </Badge>
                )}
                {item.compound.ester && (
                  <Badge variant="default" size="sm">
                    {item.compound.ester}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.localId)}
              className="text-muted hover:text-accent shrink-0"
              aria-label="Remove compound"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Weekly Dose"
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 500"
              value={item.weekly_dose}
              onChange={(e) => onChange(item.localId, { weekly_dose: e.target.value })}
            />
            <Select
              label="Unit"
              value={item.unit}
              onChange={(e) => onChange(item.localId, { unit: e.target.value as DoseUnit })}
              options={DOSE_UNITS.map((u) => ({ label: u, value: u }))}
            />
            <Select
              label="Frequency"
              value={String(item.frequency_per_week)}
              onChange={(e) =>
                onChange(item.localId, { frequency_per_week: parseInt(e.target.value, 10) })
              }
              options={FREQUENCY_OPTIONS.map((f) => ({
                label: f.label,
                value: String(f.value),
              }))}
            />
            <Input
              label="Duration (weeks)"
              type="number"
              min="1"
              placeholder="e.g. 12"
              value={item.duration_weeks}
              onChange={(e) => onChange(item.localId, { duration_weeks: e.target.value })}
            />
          </div>

          <Textarea
            label="Compound Notes"
            placeholder="Injection site, timing, educational notes…"
            value={item.notes}
            onChange={(e) => onChange(item.localId, { notes: e.target.value })}
            rows={2}
          />

          {/* Risk profile placeholder */}
          <div className="rounded-lg border border-dashed border-border/60 bg-surface/50 px-3 py-2">
            <p className="text-xs text-muted">
              Risk profile: pending evidence-based review. AI analysis coming in a future phase.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
