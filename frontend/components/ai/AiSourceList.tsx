"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import type { AiSourceReference } from "@/types/ai";

interface AiSourceListProps {
  articles?: AiSourceReference[];
  references?: AiSourceReference[];
  title?: string;
}

function SourceLink({ source }: { source: AiSourceReference }) {
  const icon =
    source.source_type === "scientific" ? (
      <ExternalLink className="h-3 w-3" />
    ) : source.source_type === "knowledge_base" ? (
      <BookOpen className="h-3 w-3" />
    ) : (
      <FlaskConical className="h-3 w-3" />
    );

  const className = "text-xs text-primary hover:underline flex items-center gap-1.5";

  if (source.url?.startsWith("http")) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer" className={className}>
        {icon}
        {source.title}
      </a>
    );
  }

  if (source.url?.startsWith("/")) {
    return (
      <Link href={source.url} className={className}>
        {icon}
        {source.title}
      </Link>
    );
  }

  return (
    <Link href="/knowledge-base" className={className}>
      {icon}
      {source.title}
    </Link>
  );
}

export function AiSourceList({ articles = [], references = [], title = "Sources" }: AiSourceListProps) {
  const all = [...articles, ...references];
  if (all.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</p>
      <ul className="space-y-1.5">
        {all.map((source, i) => (
          <li key={`${source.title}-${i}`}>
            <SourceLink source={source} />
            {source.citation_text && (
              <p className="text-xs text-muted/70 ml-4 mt-0.5 italic">{source.citation_text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
