"use client";

import { cn } from "@/utils/cn";
import type { RiskLevel } from "@/types/risk";
import { RISK_LEVEL_COLORS } from "@/types/risk";

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZES = {
  sm: { dim: 72, stroke: 6, fontSize: "text-base" },
  md: { dim: 140, stroke: 10, fontSize: "text-3xl" },
  lg: { dim: 180, stroke: 12, fontSize: "text-4xl" },
};

function strokeColorForLevel(level: RiskLevel): string {
  switch (level) {
    case "Very High":
      return "#ef4444";
    case "High":
      return "#f97316";
    case "Moderate":
      return "#f59e0b";
    case "Low":
    case "Very Low":
    default:
      return "#22c55e";
  }
}

export function RiskGauge({ score, level, size = "md", label, className }: RiskGaugeProps) {
  const { dim, stroke, fontSize } = SIZES[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = strokeColorForLevel(level);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative shrink-0" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#2a3142"
            strokeWidth={stroke}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${strokeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold text-foreground", fontSize)}>{Math.round(clamped)}</span>
          {size !== "sm" && (
            <span className={cn("text-xs font-medium mt-0.5", RISK_LEVEL_COLORS[level])}>
              {level}
            </span>
          )}
        </div>
      </div>
      {label && <p className="text-sm text-muted mt-3 text-center">{label}</p>}
    </div>
  );
}
