"use client";

import type { HealthScoreLabel, RiskLevelLabel } from "@/types/ai-insights";
import { Card, Badge } from "@/components/ui";
import { cn } from "@/utils/cn";

const SCORE_COLORS: Record<HealthScoreLabel, string> = {
  Excellent: "text-primary border-primary/40 bg-primary/10",
  Good: "text-primary border-primary/30 bg-primary/5",
  Fair: "text-secondary border-secondary/30 bg-secondary/10",
  "Needs Attention": "text-accent border-accent/30 bg-accent/10",
};

const RISK_COLORS: Record<RiskLevelLabel, string> = {
  Low: "text-primary",
  Moderate: "text-secondary",
  High: "text-accent",
};

export function HealthScoreHeader({
  score,
  label,
  explanation,
  riskLevel,
  riskExplanation,
}: {
  score: number;
  label: HealthScoreLabel;
  explanation: string;
  riskLevel: RiskLevelLabel;
  riskExplanation: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card variant="gradient" padding="lg" className={cn("border-2", SCORE_COLORS[label])}>
        <p className="text-xs uppercase tracking-wide text-muted mb-1">Overall Health Score</p>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-foreground">{score}</span>
          <Badge variant="warning" size="sm">Educational only</Badge>
        </div>
        <p className="text-lg font-semibold text-foreground mt-2">{label}</p>
        <p className="text-sm text-muted mt-2 leading-relaxed">{explanation}</p>
      </Card>

      <Card variant="elevated" padding="lg">
        <p className="text-xs uppercase tracking-wide text-muted mb-1">Risk Level</p>
        <p className={cn("text-3xl font-bold", RISK_COLORS[riskLevel])}>{riskLevel}</p>
        <p className="text-sm text-muted mt-3 leading-relaxed">{riskExplanation}</p>
      </Card>
    </div>
  );
}
