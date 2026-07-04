"use client";

import { Card } from "@/components/ui";
import {
  BloodworkResultsGroupedTable,
  type BloodworkResultRow,
} from "./BloodworkResultsGroupedTable";
import type { StructuredBloodworkMarker } from "@/types/bloodwork";

function structuredToDisplayRows(markers: StructuredBloodworkMarker[]): BloodworkResultRow[] {
  return markers
    .map((marker) => ({
      category: marker.panel,
      marker_name: marker.marker,
      result_value: marker.result,
      units: marker.unit,
      reference_range: marker.reference_range,
      status:
        marker.status === "low"
          ? ("Low" as const)
          : marker.status === "high"
            ? ("High" as const)
            : marker.status === "normal"
              ? ("Normal" as const)
              : null,
    }))
    .filter((row) => row.marker_name && row.result_value);
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
  const rows = structuredToDisplayRows(markers);

  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Extracted Bloodwork Preview</h3>
          <p className="text-sm text-muted mt-1">
            Approved pathology markers only, grouped by category.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-primary">Extracted markers: {extractedCount}</p>
          {process.env.NODE_ENV === "development" && parser && (
            <p className="text-xs text-muted mt-1">Parser: {parser}</p>
          )}
        </div>
      </div>

      <BloodworkResultsGroupedTable rows={rows} />
    </Card>
  );
}
