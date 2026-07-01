"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Filter, BookOpen, FlaskConical } from "lucide-react";
import { Input, Select, Button } from "@/components/ui";
import { ArticleCard } from "./ArticleCard";
import { CompoundKnowledgeExplorer } from "@/components/cycles/CompoundKnowledgeExplorer";
import {
  fetchKnowledgeCategories,
  searchKnowledgeArticles,
} from "@/services/knowledge";
import type { ArticleSummary, DifficultyLevel, KnowledgeCategory, KnowledgeSort } from "@/types/knowledge";
import { cn } from "@/utils/cn";

type Tab = "articles" | "compounds";

export function KnowledgeBaseHub() {
  const [tab, setTab] = useState<Tab>("articles");
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [sort, setSort] = useState<KnowledgeSort>("newest");
  const [searchType, setSearchType] = useState<"keyword" | "compound" | "blood_marker" | "peptide" | "sarm">("keyword");

  const runSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | undefined> = {
        sort,
        limit: "24",
      };
      if (categorySlug) params.category = categorySlug;
      if (difficulty) params.difficulty = difficulty;

      if (searchType === "keyword") params.q = query || undefined;
      else if (searchType === "compound") params.compound = query || undefined;
      else if (searchType === "blood_marker") params.blood_marker = query || undefined;
      else if (searchType === "peptide") params.peptide = query || undefined;
      else if (searchType === "sarm") params.sarm = query || undefined;

      const result = await searchKnowledgeArticles(params);
      setArticles(result.articles);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [query, categorySlug, difficulty, sort, searchType]);

  useEffect(() => {
    fetchKnowledgeCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "articles") runSearch();
  }, [tab, runSearch]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border/50 pb-2">
        <button
          type="button"
          onClick={() => setTab("articles")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            tab === "articles" ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Articles
        </button>
        <button
          type="button"
          onClick={() => setTab("compounds")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            tab === "compounds" ? "bg-primary/15 text-primary" : "text-muted hover:text-foreground"
          )}
        >
          <FlaskConical className="h-4 w-4" />
          Compounds
        </button>
      </div>

      {tab === "compounds" ? (
        <CompoundKnowledgeExplorer />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <Input
                placeholder={
                  searchType === "blood_marker"
                    ? "Search by blood marker (e.g. ALT, HDL)…"
                    : searchType === "compound"
                      ? "Search by compound name…"
                      : searchType === "peptide"
                        ? "Search peptides…"
                        : searchType === "sarm"
                          ? "Search SARMs…"
                          : "Search articles by keyword…"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button onClick={runSearch} isLoading={isLoading}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <Select
              label="Search by"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as typeof searchType)}
              options={[
                { label: "Keyword", value: "keyword" },
                { label: "Compound", value: "compound" },
                { label: "Blood Marker", value: "blood_marker" },
                { label: "Peptide", value: "peptide" },
                { label: "SARM", value: "sarm" },
              ]}
              className="min-w-[140px]"
            />
            <Select
              label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as KnowledgeSort)}
              options={[
                { label: "Newest", value: "newest" },
                { label: "Most Popular", value: "popular" },
                { label: "Recently Updated", value: "updated" },
              ]}
              className="min-w-[140px]"
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | "")}
              options={[
                { label: "All levels", value: "" },
                { label: "Beginner", value: "beginner" },
                { label: "Intermediate", value: "intermediate" },
                { label: "Advanced", value: "advanced" },
              ]}
              className="min-w-[140px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategorySlug("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                !categorySlug
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface text-muted border-border hover:border-primary/30"
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategorySlug(cat.slug)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  categorySlug === cat.slug
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-surface text-muted border-border hover:border-primary/30"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-accent" role="alert">{error}</p>}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {total} article{total !== 1 ? "s" : ""} found
            </p>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted text-center py-12 animate-pulse">Searching knowledge base…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {articles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <p className="text-sm text-muted text-center py-12">No articles match your search.</p>
          )}
        </>
      )}
    </div>
  );
}
