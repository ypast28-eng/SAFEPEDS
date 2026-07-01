"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FlaskConical,
  Droplets,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { TopicCard } from "./TopicCard";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchHealthTopic,
  toggleBookmark,
  recordTopicView,
} from "@/services/health-library";
import type { HealthTopicDetail, SupportOption } from "@/types/health-library";
import { SUPPORT_TYPE_COLORS } from "@/types/health-library";
import { cn } from "@/utils/cn";

interface TopicDetailViewProps {
  slug: string;
}

function SupportSection({ option }: { option: SupportOption }) {
  return (
    <Card variant="bordered" padding="md" className="mb-3">
      <Badge variant="default" size="sm" className={cn("mb-2", SUPPORT_TYPE_COLORS[option.type])}>
        {option.type}
      </Badge>
      <h4 className="text-sm font-semibold text-foreground mb-2">{option.title}</h4>
      {option.details.map((d) => (
        <div key={d.id} className="space-y-2 mb-3 last:mb-0">
          <p className="text-sm text-muted leading-relaxed">{d.description}</p>
          {d.notes && (
            <p className="text-xs text-muted/80 flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
              {d.notes}
            </p>
          )}
          {d.scientific_references.length > 0 && (
            <ul className="space-y-1">
              {d.scientific_references.map((ref, i) => (
                <li key={i}>
                  {ref.url ? (
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {ref.title}
                    </a>
                  ) : (
                    <span className="text-xs text-muted">{ref.title}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Card>
  );
}

export function TopicDetailView({ slug }: TopicDetailViewProps) {
  const { session, user } = useAuth();
  const [topic, setTopic] = useState<HealthTopicDetail | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchHealthTopic(slug)
      .then((t) => {
        setTopic(t);
        if (user && session) {
          recordTopicView(t.id, session.access_token).catch(() => {});
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setIsLoading(false));
  }, [slug, user, session]);

  const handleBookmark = async () => {
    if (!session) return;
    const res = await toggleBookmark(topic!.id, session.access_token);
    setBookmarked(res.bookmarked);
  };

  if (isLoading) return <p className="text-center py-16 text-muted animate-pulse">Loading…</p>;
  if (error || !topic) {
    return (
      <Card variant="bordered" padding="lg">
        <p className="text-accent text-center">{error ?? "Not found"}</p>
        <Link href="/health-library" className="block text-center mt-4">
          <Button variant="outline">Back</Button>
        </Link>
      </Card>
    );
  }

  const lifestyle = topic.support_options.filter((o) => o.type === "Lifestyle");
  const monitoring = topic.support_options.filter((o) => o.type === "Monitoring");
  const supplements = topic.support_options.filter((o) => o.type === "Supplement");
  const medications = topic.support_options.filter((o) => o.type === "Medication Information");
  const other = topic.support_options.filter(
    (o) => !["Lifestyle", "Monitoring", "Supplement", "Medication Information"].includes(o.type)
  );

  return (
    <div className="space-y-8 animate-fade-slide-up max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Link href="/health-library">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Health Library
          </Button>
        </Link>
        {session && (
          <Button variant="outline" size="sm" onClick={handleBookmark}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "Saved" : "Bookmark"}
          </Button>
        )}
      </div>

      <Card variant="elevated" padding="lg">
        <Badge variant="secondary" className="mb-3">{topic.category}</Badge>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-7 w-7 text-secondary shrink-0" />
          {topic.title}
        </h1>
        {topic.summary && <p className="text-muted mt-3 leading-relaxed">{topic.summary}</p>}
      </Card>

      {topic.overview && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Overview</h2>
          <Card variant="gradient" padding="md">
            <p className="text-sm text-muted leading-relaxed">{topic.overview}</p>
          </Card>
        </section>
      )}

      {topic.why_it_matters && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Why It Matters</h2>
          <Card variant="gradient" padding="md">
            <p className="text-sm text-muted leading-relaxed">{topic.why_it_matters}</p>
          </Card>
        </section>
      )}

      {topic.blood_markers_involved.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Blood Markers Involved
          </h2>
          <div className="flex flex-wrap gap-2">
            {topic.blood_markers_involved.map((m) => (
              <Link key={m} href={`/health-library?marker=${encodeURIComponent(m)}`}>
                <Badge variant="primary" className="hover:bg-primary/20 cursor-pointer">{m}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topic.related_compounds.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Related Compounds
          </h2>
          <div className="flex flex-wrap gap-2">
            {topic.related_compounds.map((c) => (
              <Badge key={c.id} variant="info">{c.name}</Badge>
            ))}
          </div>
        </section>
      )}

      {lifestyle.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Lifestyle Considerations</h2>
          {lifestyle.map((o) => <SupportSection key={o.id} option={o} />)}
        </section>
      )}

      {monitoring.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Monitoring Considerations</h2>
          {monitoring.map((o) => <SupportSection key={o.id} option={o} />)}
        </section>
      )}

      {supplements.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Commonly Discussed Supplements (Educational)
          </h2>
          {supplements.map((o) => <SupportSection key={o.id} option={o} />)}
        </section>
      )}

      {medications.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Medication Information (Educational Only)
          </h2>
          {medications.map((o) => <SupportSection key={o.id} option={o} />)}
        </section>
      )}

      {other.map((o) => <SupportSection key={o.id} option={o} />)}

      {topic.related_knowledge_articles.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Related Knowledge Base Articles
          </h2>
          <div className="space-y-2">
            {topic.related_knowledge_articles.map((a) => (
              <Link key={a.id} href={`/knowledge-base/articles/${a.slug}`}>
                <Card variant="bordered" padding="sm" hover className="block">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  {a.summary && <p className="text-xs text-muted mt-1">{a.summary}</p>}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topic.related_topics.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Related Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topic.related_topics.map((t, i) => (
              <TopicCard key={t.id} topic={t} index={i} />
            ))}
          </div>
        </section>
      )}

      <Card variant="bordered" padding="md" className="border-secondary/30 bg-secondary/5">
        <p className="text-xs text-muted flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-secondary shrink-0" />
          Educational information only. Does not diagnose disease, prescribe medication, or recommend
          PED dosages. Do not start, stop, or change any medication based on this content.
        </p>
      </Card>
    </div>
  );
}
