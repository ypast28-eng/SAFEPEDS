"use client";

import { useState } from "react";
import { Search, Plus, FlaskConical } from "lucide-react";
import { Input, Card, Badge, Button } from "@/components/ui";
import { useCompoundCategories } from "@/hooks/useCompoundCategories";
import { useCompounds } from "@/hooks/useCompounds";
import type { CompoundWithRelations } from "@/types/compounds";
import { cn } from "@/utils/cn";

interface CompoundLibraryProps {
  onSelect: (compound: CompoundWithRelations) => void;
  selectedIds: Set<string>;
}

export function CompoundLibrary({ onSelect, selectedIds }: CompoundLibraryProps) {
  const { categories, isLoading: categoriesLoading } = useCompoundCategories();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { compounds, isLoading, error } = useCompounds({ search, categoryId });

  return (
    <Card variant="elevated" padding="md" className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Compound Library
        </h3>
        <Input
          placeholder="Search compounds…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 max-h-28 overflow-y-auto">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200",
            categoryId === null
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-surface text-muted border-border hover:border-primary/30"
          )}
        >
          All
        </button>
        {!categoriesLoading &&
          categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200",
                categoryId === cat.id
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface text-muted border-border hover:border-primary/30"
              )}
            >
              {cat.name}
            </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[420px] pr-1">
        {isLoading && (
          <p className="text-sm text-muted text-center py-8 animate-pulse">Loading compounds…</p>
        )}
        {!isLoading && error && (
          <p className="text-sm text-accent text-center py-8" role="alert">{error}</p>
        )}
        {!isLoading && !error && compounds.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No compounds found</p>
        )}
        {compounds.map((compound) => {
          const isSelected = selectedIds.has(compound.id);
          return (
            <div
              key={compound.id}
              className={cn(
                "flex items-center justify-between gap-3 p-3 rounded-lg border transition-all duration-200",
                isSelected
                  ? "border-primary/30 bg-primary/5 opacity-60"
                  : "border-border/50 bg-surface hover:border-primary/20 hover:bg-surface-elevated/50"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{compound.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {compound.category && (
                    <Badge variant="default" size="sm">
                      {compound.category.name}
                    </Badge>
                  )}
                  <Badge variant="info" size="sm">
                    {compound.administration.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isSelected ? "ghost" : "outline"}
                disabled={isSelected}
                onClick={() => onSelect(compound)}
                className="shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                {isSelected ? "Added" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
