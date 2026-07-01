"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, TrendingUp, Sparkles } from "lucide-react";
import { fetchFeaturedArticles } from "@/services/knowledge";
import type { ArticleSummary } from "@/types/knowledge";
import { ArticleCard } from "@/components/knowledge/ArticleCard";

function ArticleRow({ title, icon, articles }: { title: string; icon: React.ReactNode; articles: ArticleSummary[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="mb-10">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 3).map((a, i) => (
          <ArticleCard key={a.id} article={a} index={i} />
        ))}
      </div>
    </div>
  );
}

export function FeaturedArticlesSection() {
  const [featured, setFeatured] = useState<{
    newest: ArticleSummary[];
    popular: ArticleSummary[];
    recently_updated: ArticleSummary[];
  } | null>(null);

  useEffect(() => {
    fetchFeaturedArticles()
      .then(setFeatured)
      .catch(() => setFeatured(null));
  }, []);

  if (!featured) return null;

  const hasContent =
    featured.newest.length > 0 ||
    featured.popular.length > 0 ||
    featured.recently_updated.length > 0;

  if (!hasContent) return null;

  return (
    <section className="py-20 px-4 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <BadgeChip />
          <h2 className="text-3xl font-bold text-foreground mt-4">Scientific Knowledge Base</h2>
          <p className="text-muted mt-3 max-w-2xl mx-auto">
            Curated educational articles powering our AI. Evidence-based content on compounds,
            bloodwork, and health monitoring.
          </p>
          <Link
            href="/knowledge-base"
            className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            Browse all articles
          </Link>
        </div>
        <ArticleRow title="Newest Articles" icon={<Sparkles className="h-5 w-5 text-primary" />} articles={featured.newest} />
        <ArticleRow title="Popular Articles" icon={<TrendingUp className="h-5 w-5 text-secondary" />} articles={featured.popular} />
        <ArticleRow title="Recently Updated" icon={<BookOpen className="h-5 w-5 text-primary" />} articles={featured.recently_updated} />
      </div>
    </section>
  );
}

function BadgeChip() {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30">
      Knowledge Base
    </span>
  );
}
