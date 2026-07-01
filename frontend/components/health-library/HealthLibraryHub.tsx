"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Heart, Bookmark, Clock } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { TopicCard } from "./TopicCard";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBookmarks,
  fetchRecentTopics,
  fetchHealthCategories,
  searchHealthTopics,
} from "@/services/health-library";
import type { HealthTopicSummary } from "@/types/health-library";
import { cn } from "@/utils/cn";

interface HealthLibraryHubProps {
  initialCategory?: string;
  initialRisk?: string;
  initialMarker?: string;
}

export function HealthLibraryHub({ initialCategory, initialRisk, initialMarker }: HealthLibraryHubProps) {
  const { session } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [topics, setTopics] = useState<HealthTopicSummary[]>([]);
  const [bookmarks, setBookmarks] = useState<HealthTopicSummary[]>([]);
  const [recent, setRecent] = useState<HealthTopicSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "bookmarks" | "recent">("browse");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tab === "bookmarks" && session) {
        setBookmarks(await fetchBookmarks(session.access_token));
      } else if (tab === "recent" && session) {
        setRecent(await fetchRecentTopics(session.access_token));
      } else {
        const result = await searchHealthTopics({
          q: query || undefined,
          category: category || undefined,
          blood_marker: initialMarker || undefined,
        });
        let list = result.topics;
        if (initialRisk) {
          const { fetchTopicsForRiskCategory } = await import("@/services/health-library");
          list = await fetchTopicsForRiskCategory(initialRisk);
          setTotal(list.length);
        } else {
          setTotal(result.total);
        }
        setTopics(list);
        if (result.categories.length) setCategories(result.categories);
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, category, tab, session, initialRisk, initialMarker]);

  useEffect(() => {
    fetchHealthCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const displayTopics =
    tab === "bookmarks" ? bookmarks : tab === "recent" ? recent : topics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
        {(["browse", "bookmarks", "recent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg capitalize",
              tab === t ? "bg-secondary/15 text-secondary" : "text-muted hover:text-foreground"
            )}
          >
            {t === "bookmarks" && <Bookmark className="h-4 w-4" />}
            {t === "recent" && <Clock className="h-4 w-4" />}
            {t === "browse" && <Heart className="h-4 w-4" />}
            {t}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search health topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              leftIcon={<Search className="h-4 w-4" />}
              className="flex-1"
            />
            <Button onClick={load} isLoading={isLoading}>Search</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border",
                !category ? "bg-secondary/15 text-secondary border-secondary/30" : "text-muted border-border"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border",
                  category === cat ? "bg-secondary/15 text-secondary border-secondary/30" : "text-muted border-border"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted">{total} topic{total !== 1 ? "s" : ""}</p>
        </>
      )}

      {isLoading ? (
        <p className="text-center py-12 text-muted animate-pulse">Loading…</p>
      ) : displayTopics.length === 0 ? (
        <p className="text-center py-12 text-muted">No topics found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayTopics.map((t, i) => (
            <TopicCard key={t.id} topic={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
