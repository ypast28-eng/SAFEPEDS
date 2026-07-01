"use client";

import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { CategoryRiskOutput } from "@/types/risk";
import { RISK_LEVEL_BG, RISK_LEVEL_COLORS } from "@/types/risk";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CategoryRiskCardProps {
  category: CategoryRiskOutput;
  index?: number;
}

export function CategoryRiskCard({ category, index = 0 }: CategoryRiskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const level = category.level;

  return (
    <Card
      variant="gradient"
      padding="md"
      className={cn(
        "border transition-all duration-300 animate-fade-slide-up",
        RISK_LEVEL_BG[level]
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted uppercase tracking-wider">{category.category_name}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-foreground">{category.score}</span>
            <span className={cn("text-sm font-medium", RISK_LEVEL_COLORS[level])}>{level}</span>
          </div>
          {/* Score bar */}
          <div className="mt-3 h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${category.score}%`,
                background:
                  level === "Very High" || level === "High"
                    ? "#ef4444"
                    : level === "Moderate"
                      ? "#d4a853"
                      : "#14b8a6",
              }}
            />
          </div>
        </div>
        {category.triggered_rules.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted hover:text-foreground p-1"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {expanded && category.triggered_rules.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
          <p className="text-xs text-muted font-medium">Triggered Rules ({category.triggered_rules.length})</p>
          {category.triggered_rules.map((rule) => (
            <div key={rule.rule_key} className="text-xs rounded-lg bg-surface/80 px-3 py-2">
              <p className="font-medium text-foreground">{rule.name}</p>
              <p className="text-muted mt-0.5">{rule.explanation}</p>
              {rule.evidence_placeholder && (
                <p className="text-muted/60 mt-1 italic">{rule.evidence_placeholder}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
