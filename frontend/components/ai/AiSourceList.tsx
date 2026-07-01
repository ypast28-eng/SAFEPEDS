"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, FlaskConical } from "lucide-react";
import type { AiSourceReference } from "@/types/ai";

interface AiSourceListProps {
  articles?: AiSourceReference[];
  references?: AiSourceReference[];
  title?: string;
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
            {source.url ? (
              <a
                href={source.url.startsWith("http") ? source.url : undefined}
                target={source.url.startsWith("http") ? "_blank" : undefined}
                rel={source.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs text-primary hover:underline flex items-center gap-1.5"
              >
                {source.source_type === "scientific" ? (
                  <ExternalLink className="h-3 w-3" />
                ) : source.source_type === "knowledge_base" ? (
                  <FlaskConical className="h-3 w-3" />
                ) : (
                  <BookOpen className="h-3 w-3" />
                )}
                {source.title}
              </a>
            ) : (
              <Link
                href="/knowledge-base"
                className="text-xs text-primary hover:underline flex items-center gap-1.5"
              >
                <BookOpen className="h-3 w-3" />
                {source.title}
              </Link>
            )}
            {source.citation_text && (
              <p className="text-xs text-muted/70 ml-4 mt-0.5 italic">{source.citation_text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
