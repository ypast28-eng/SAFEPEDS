import { Anchor, HelpCircle, PauseCircle, Zap } from "lucide-react";
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
    title: "Cruise",
    description:
      "Lower-dose or maintenance phase. Saved as your personal baseline for future comparisons.",
    icon: Anchor,
  },
  {
    value: "blast",
    title: "Blast",
    description:
      "Higher-dose cycle phase. Compared against clinical ranges and your cruise baseline.",
    icon: Zap,
  },
  {
    value: "off",
    title: "Off",
    description:
      "Between phases or not currently running a defined cruise/blast block. Still useful for tracking.",
    icon: PauseCircle,
  },
  {
    value: "unknown",
    title: "Unknown",
    description:
      "Phase not specified on the lab report or unsure when this panel was collected.",
    icon: HelpCircle,
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
  const selected = value ?? "cruise";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">When was this bloodwork taken?</h3>
        <p className="text-sm text-muted mt-1">
          Select Cruise, Blast, Off, or Unknown. Educational tracking only — not medical advice.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        role="radiogroup"
        aria-label="Bloodwork phase"
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-col items-start text-left p-5 rounded-xl border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/60 bg-surface/50 hover:border-primary/40 hover:bg-surface"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    isSelected ? "bg-primary/20" : "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted")} />
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
