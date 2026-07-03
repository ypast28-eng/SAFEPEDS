"use client";

import { Card } from "@/components/ui";
import { StatusBadge } from "./StatusBadge";
import type { StructuredBloodworkMarker } from "@/types/bloodwork";
import { cn } from "@/utils/cn";

function displayStatus(status: StructuredBloodworkMarker["status"]) {
  if (status === "low") return "Low";
  if (status === "high") return "High";
  if (status === "normal") return "Normal";
  return null;
}

export function BloodworkExtractionPreview({
  markers,
  extractedCount,
  parser,
}: {
  markers: StructuredBloodworkMarker[];
  extractedCount: number;
  parser?: "pdf" | "openai";
}) {
  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Extracted Bloodwork Preview</h3>
          <p className="text-sm text-muted mt-1">
            Structured markers parsed from your uploaded report. Review before continuing.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary">Extracted markers: {extractedCount}</p>
          {process.env.NODE_ENV === "development" && parser && (
            <p className="text-xs text-muted mt-1">Parser: {parser}</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="min-w-full text-sm">
          <thead className="bg-surface/80 text-left">
            <tr>
              {["Panel", "Marker", "Result", "Units", "Reference Range", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 font-medium text-muted whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markers.map((marker) => {
              const rowStatus = displayStatus(marker.status);
              return (
                <tr
                  key={`${marker.panel}-${marker.marker}-${marker.result}`}
                  className={cn(
                    "border-t border-border/40",
                    marker.status === "high" && "bg-accent/5",
                    marker.status === "low" && "bg-primary/5",
                    marker.status === "unknown" && "bg-surface/60"
                  )}
                >
                  <td className="px-3 py-2 text-muted whitespace-nowrap">{marker.panel}</td>
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {marker.marker}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {marker.result}
                    {marker.flag ? (
                      <span className="ml-1 text-xs text-secondary">({marker.flag})</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">{marker.unit || "—"}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {marker.reference_range || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {rowStatus ? (
                      <StatusBadge status={rowStatus} />
                    ) : (
                      <span className="text-xs text-muted">Unknown</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
