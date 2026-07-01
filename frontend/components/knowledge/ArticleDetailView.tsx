"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, FlaskConical, Droplets, Eye } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { ArticleCard } from "./ArticleCard";
import { fetchArticleBySlug } from "@/services/knowledge";
import type { ArticleDetail } from "@/types/knowledge";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/types/knowledge";
import { cn } from "@/utils/cn";

interface ArticleDetailViewProps {
  slug: string;
}

function renderContent(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="text-sm text-muted ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    }
    if (!line.trim()) return <br key={i} />;
    return (
      <p key={i} className="text-sm text-muted leading-relaxed mb-3">
        {line}
      </p>
    );
  });
}

export function ArticleDetailView({ slug }: ArticleDetailViewProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchArticleBySlug(slug)
      .then(setArticle)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return <p className="text-muted text-center py-16 animate-pulse">Loading article…</p>;
  }

  if (error || !article) {
    return (
      <Card variant="bordered" padding="lg">
        <p className="text-accent text-center">{error ?? "Article not found"}</p>
        <Link href="/knowledge-base" className="block text-center mt-4">
          <Button variant="outline">Back to Knowledge Base</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-up">
      <Link href="/knowledge-base">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Knowledge Base
        </Button>
      </Link>

      <Card variant="elevated" padding="lg">
        {article.image_url && (
          <div
            className="h-48 -mx-6 -mt-6 mb-6 rounded-t-xl bg-cover bg-center"
            style={{ backgroundImage: `url(${article.image_url})` }}
          />
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="primary">{article.category.name}</Badge>
          <Badge variant="secondary" className={cn(DIFFICULTY_COLORS[article.difficulty_level])}>
            {DIFFICULTY_LABELS[article.difficulty_level]}
          </Badge>
          <Badge variant="default" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.view_count}
          </Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{article.title}</h1>
        {article.summary && (
          <p className="text-base text-muted mt-3 leading-relaxed">{article.summary}</p>
        )}
      </Card>

      <Card variant="gradient" padding="lg">
        <div className="prose prose-invert max-w-none">{renderContent(article.content)}</div>
      </Card>

      {article.related_compounds.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Related Compounds
          </h2>
          <div className="flex flex-wrap gap-2">
            {article.related_compounds.map((c) => (
              <Badge key={c.id} variant="info">{c.name}</Badge>
            ))}
          </div>
        </section>
      )}

      {article.related_blood_markers.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-secondary" />
            Related Blood Markers
          </h2>
          <div className="flex flex-wrap gap-2">
            {article.related_blood_markers.map((m) => (
              <Badge key={m.id} variant="secondary">{m.name}</Badge>
            ))}
          </div>
        </section>
      )}

      {article.references.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3">Scientific References</h2>
          <div className="space-y-3">
            {article.references.map((ref) => (
              <Card key={ref.id} variant="bordered" padding="md">
                <p className="text-sm font-medium text-foreground">{ref.title}</p>
                {ref.authors && <p className="text-xs text-muted mt-1">{ref.authors}</p>}
                {(ref.journal || ref.publication_year) && (
                  <p className="text-xs text-muted">
                    {ref.journal}{ref.publication_year ? ` (${ref.publication_year})` : ""}
                  </p>
                )}
                {ref.doi && <p className="text-xs text-muted">DOI: {ref.doi}</p>}
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View source
                  </a>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {article.related_articles.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {article.related_articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted/70 text-center border-t border-border/30 pt-6">
        Educational content only. Not medical advice. Does not diagnose or prescribe.
      </p>
    </div>
  );
}
