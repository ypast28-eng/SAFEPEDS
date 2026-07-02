"use client";

import { Anchor, Zap } from "lucide-react";
import { cn } from "@/utils/cn";
import type { BloodworkPhaseInput } from "@/types/bloodwork";

const OPTIONS: Array<{
  value: BloodworkPhaseInput;
  title: string;
  description: string;
  icon: typeof Anchor;
}> = [
  {
    value: "cruise",
    title: "Cruise / Baseline",
    description:
      "Lower-dose or maintenance phase. Saved as your personal baseline for future comparisons.",
    icon: Anchor,
  },
  {
    value: "blast",
    title: "Blast / Cycle",
    description:
      "Higher-dose cycle phase. Compared against clinical ranges and your cruise baseline.",
    icon: Zap,
  },
];

export function BloodworkPhaseSelector({
  value,
  onChange,
  error,
}: {
  value: BloodworkPhaseInput | null;
  onChange: (phase: BloodworkPhaseInput) => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">When was this bloodwork taken?</h3>
        <p className="text-sm text-muted mt-1">
          Select the phase that best matches when this panel was collected. Educational tracking
          only — not medical advice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-label="Bloodwork phase">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-col items-start text-left p-5 rounded-xl border-2 transition-all",
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/60 bg-surface/50 hover:border-primary/40 hover:bg-surface"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    selected ? "bg-primary/20" : "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted")} />
                </div>
                <span className="text-base font-semibold text-foreground">{option.title}</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">{option.description}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
