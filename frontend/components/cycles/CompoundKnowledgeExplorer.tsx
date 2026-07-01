"use client";

import { useState } from "react";
import { Search, BookOpen, Info } from "lucide-react";
import { Input, Card, Badge } from "@/components/ui";
import { useCompoundCategories } from "@/hooks/useCompoundCategories";
import { useCompounds } from "@/hooks/useCompounds";
import { cn } from "@/utils/cn";

export function CompoundKnowledgeExplorer() {
  const { categories } = useCompoundCategories();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { compounds, isLoading } = useCompounds({ search, categoryId });

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search the compound database…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
            categoryId === null
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
            onClick={() => setCategoryId(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              categoryId === cat.id
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-surface text-muted border-border hover:border-primary/30"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted text-center py-12 animate-pulse">Loading database…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {compounds.map((compound, index) => (
            <Card
              key={compound.id}
              variant="gradient"
              hover
              padding="md"
              className="animate-fade-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{compound.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {compound.category && (
                      <Badge variant="secondary" size="sm">
                        {compound.category.name}
                      </Badge>
                    )}
                    <Badge variant="info" size="sm">
                      {compound.compound_type}
                    </Badge>
                  </div>
                  {compound.description && (
                    <p className="text-xs text-muted mt-2 line-clamp-2">{compound.description}</p>
                  )}
                  <div className="mt-3 flex items-start gap-1.5 rounded-md bg-surface/80 border border-border/40 px-2 py-1.5">
                    <Info className="h-3 w-3 text-muted shrink-0 mt-0.5" />
                    <p className="text-xs text-muted">
                      Risk scores pending evidence-based review.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && compounds.length === 0 && (
        <p className="text-sm text-muted text-center py-12">No compounds match your search.</p>
      )}
    </div>
  );
}
