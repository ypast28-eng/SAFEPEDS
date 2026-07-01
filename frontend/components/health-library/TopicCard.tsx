"use client";

import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { HealthTopicSummary } from "@/types/health-library";

interface TopicCardProps {
  topic: HealthTopicSummary;
  index?: number;
}

export function TopicCard({ topic, index = 0 }: TopicCardProps) {
  return (
    <Link href={`/health-library/${topic.slug}`}>
      <Card
        variant="gradient"
        hover
        padding="md"
        className="h-full border border-border/40 animate-fade-slide-up"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
            <Heart className="h-4 w-4 text-secondary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{topic.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="secondary" size="sm">{topic.category}</Badge>
            </div>
            {topic.summary && (
              <p className="text-xs text-muted mt-2 line-clamp-2">{topic.summary}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted">
              <Eye className="h-3 w-3" />
              {topic.view_count}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
