"use client";

import { StatusBadge } from "./StatusBadge";
import {
  BLOODWORK_DISPLAY_CATEGORY_ORDER,
  isApprovedBloodworkMarker,
} from "@/lib/bloodwork/approved-markers";
import { cn } from "@/utils/cn";

export interface BloodworkResultRow {
  id?: string;
  category: string;
  marker_name: string;
  result_value: string;
  units: string;
  reference_range: string;
  status: "Low" | "Normal" | "High" | null;
}

function filterApprovedRows(rows: BloodworkResultRow[]): BloodworkResultRow[] {
  return rows.filter((row) => isApprovedBloodworkMarker(row.category, row.marker_name));
}

function groupByCategory(rows: BloodworkResultRow[]): Map<string, BloodworkResultRow[]> {
  const grouped = new Map<string, BloodworkResultRow[]>();
  for (const category of BLOODWORK_DISPLAY_CATEGORY_ORDER) {
    const items = rows.filter((row) => row.category === category);
    if (items.length > 0) grouped.set(category, items);
  }
  return grouped;
}

export function BloodworkResultsGroupedTable({
  rows,
  emptyMessage = "No marker results to display.",
}: {
  rows: BloodworkResultRow[];
  emptyMessage?: string;
}) {
  const approvedRows = filterApprovedRows(rows);
  const grouped = groupByCategory(approvedRows);

  if (grouped.size === 0) {
    return <p className="text-sm text-muted text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([category, categoryRows]) => (
        <div key={category} className="overflow-x-auto rounded-xl border border-border/50">
          <div className="bg-surface/90 px-4 py-3 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground tracking-wide">{category}</h3>
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-surface/60 text-left">
              <tr>
                {["Marker", "Result", "Units", "Reference Range", "Status"].map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 font-medium text-muted whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((row) => (
                <tr
                  key={row.id ?? `${category}-${row.marker_name}`}
                  className={cn(
                    "border-t border-border/40",
                    row.status === "High" && "bg-accent/5",
                    row.status === "Low" && "bg-primary/5"
                  )}
                >
                  <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                    {row.marker_name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.result_value}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {row.units ? row.units : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {row.reference_range ? row.reference_range : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export function bloodworkResultToDisplayRow(result: {
  id?: string;
  category?: string;
  panel?: string;
  marker_name?: string;
  marker?: string;
  result_value?: number;
  numeric_value?: number;
  result?: string | null;
  result_text?: string | null;
  unit?: string;
  reference_range?: string | null;
  reference_low?: number | null;
  reference_high?: number | null;
  range_low?: number | null;
  range_high?: number | null;
  status?: "Low" | "Normal" | "High" | null;
}): BloodworkResultRow | null {
  const category = result.category?.trim() || result.panel?.trim() || "";
  const marker_name = result.marker_name?.trim() || result.marker?.trim() || "";
  if (!category || !marker_name) return null;
  if (!isApprovedBloodworkMarker(category, marker_name)) return null;

  const result_value =
    result.result_text?.trim() ||
    result.result?.trim() ||
    (result.result_value != null ? String(result.result_value) : result.numeric_value != null ? String(result.numeric_value) : "");

  if (!result_value) return null;

  return {
    id: result.id,
    category,
    marker_name,
    result_value,
    units: result.unit?.trim() ?? "",
    reference_range: result.reference_range?.trim() ?? "",
    status: result.status ?? null,
  };
}
