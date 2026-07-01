"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import type { CategoryRiskOutput } from "@/types/risk";
import { RISK_LEVEL_BG, RISK_LEVEL_COLORS } from "@/types/risk";
import { fetchTopicsForRiskCategory } from "@/services/health-library";
import type { HealthTopicSummary } from "@/types/health-library";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";

interface CategoryRiskCardProps {
  category: CategoryRiskOutput;
  index?: number;
}

const LEARN_MORE_LEVELS = new Set(["Moderate", "High", "Very High"]);

export function CategoryRiskCard({ category, index = 0 }: CategoryRiskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [relatedTopics, setRelatedTopics] = useState<HealthTopicSummary[]>([]);
  const level = category.level;
  const showLearnMore = LEARN_MORE_LEVELS.has(level);

  useEffect(() => {
    if (!showLearnMore) return;
    fetchTopicsForRiskCategory(category.category)
      .then(setRelatedTopics)
      .catch(() => setRelatedTopics([]));
  }, [category.category, showLearnMore]);

  const learnMoreHref =
    relatedTopics.length > 0
      ? `/health-library/${relatedTopics[0].slug}`
      : `/health-library?risk=${encodeURIComponent(category.category)}`;

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
          {showLearnMore && (
            <Link
              href={learnMoreHref}
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-secondary hover:text-secondary/80"
            >
              <Heart className="h-3.5 w-3.5" />
              Learn More
            </Link>
          )}
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
          {showLearnMore && relatedTopics.length > 1 && (
            <div className="pt-2 space-y-1">
              <p className="text-xs text-muted font-medium">Related Health Library Topics</p>
              {relatedTopics.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/health-library/${t.slug}`}
                  className="block text-xs text-secondary hover:underline"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
