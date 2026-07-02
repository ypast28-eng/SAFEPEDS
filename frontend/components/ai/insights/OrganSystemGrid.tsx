"use client";

import { Card, Badge } from "@/components/ui";
import type { OrganSystemCard, OrganStatus } from "@/types/ai-insights";
import { cn } from "@/utils/cn";

const STATUS_STYLES: Record<OrganStatus, string> = {
  Good: "border-primary/30 bg-primary/5",
  Monitor: "border-secondary/30 bg-secondary/5",
  "Needs Attention": "border-accent/30 bg-accent/5",
  Critical: "border-accent/50 bg-accent/10",
};

export function OrganSystemGrid({ systems }: { systems: OrganSystemCard[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Organ System Report</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {systems.map((sys) => (
          <Card
            key={sys.system}
            variant="bordered"
            padding="md"
            className={cn("transition-colors", STATUS_STYLES[sys.status])}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl" aria-hidden>{sys.icon}</span>
              <Badge
                variant={
                  sys.status === "Good"
                    ? "primary"
                    : sys.status === "Monitor"
                      ? "warning"
                      : "danger"
                }
                size="sm"
              >
                {sys.status}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{sys.label}</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">{sys.summary}</p>
            {sys.markers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {sys.markers.slice(0, 4).map((m) => (
                  <Badge key={m} variant="default" size="sm">{m}</Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
