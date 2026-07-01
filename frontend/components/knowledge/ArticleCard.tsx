"use client";

import Link from "next/link";
import { BookOpen, Eye } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import type { ArticleSummary } from "@/types/knowledge";
import { DIFFICULTY_COLORS } from "@/types/knowledge";
import { cn } from "@/utils/cn";

interface ArticleCardProps {
  article: ArticleSummary;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  return (
    <Link href={`/knowledge-base/articles/${article.slug}`}>
      <Card
        variant="gradient"
        hover
        padding="md"
        className="h-full animate-fade-slide-up border border-border/40"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {article.image_url && (
          <div
            className="h-32 -mx-4 -mt-4 mb-4 rounded-t-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${article.image_url})` }}
          />
        )}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2">{article.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="secondary" size="sm">{article.category.name}</Badge>
              <Badge variant="default" size="sm" className={cn(DIFFICULTY_COLORS[article.difficulty_level])}>
                {article.difficulty_level}
              </Badge>
            </div>
            {article.summary && (
              <p className="text-xs text-muted mt-2 line-clamp-2">{article.summary}</p>
            )}
            <div className="flex items-center gap-1 mt-3 text-xs text-muted">
              <Eye className="h-3 w-3" />
              {article.view_count} views
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
