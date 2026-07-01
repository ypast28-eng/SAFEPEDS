"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/utils/cn";

interface AiExpandableSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  className?: string;
}

export function AiExpandableSection({
  title,
  children,
  defaultOpen = true,
  badge,
  className,
}: AiExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card variant="gradient" padding="md" className={cn("border border-border/40", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>
      {open && <div className="mt-4 pt-3 border-t border-border/30 animate-fade-slide-up">{children}</div>}
    </Card>
  );
}
