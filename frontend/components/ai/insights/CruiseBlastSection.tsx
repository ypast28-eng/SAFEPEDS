"use client";

import { Card, Badge } from "@/components/ui";
import { formatBloodworkPhase } from "@/lib/bloodwork/phase";
import type { CruiseBlastComparison } from "@/types/ai-insights";

function MarkerList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ marker_name: string; note?: string; value?: number; unit?: string; status?: string }>;
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.marker_name} className="text-xs text-muted">
              <strong className="text-foreground">{item.marker_name}</strong>
              {item.value != null && (
                <span>
                  {": "}
                  {item.value} {item.unit}
                  {item.status ? ` (${item.status})` : ""}
                </span>
              )}
              {item.note && <span> — {item.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CruiseBlastSection({ comparison }: { comparison: CruiseBlastComparison | null }) {
  if (!comparison) {
    return (
      <Card variant="bordered" padding="md">
        <h2 className="text-base font-semibold text-foreground mb-2">Cruise vs Blast</h2>
        <p className="text-sm text-muted">
          Tag bloodwork as cruise (baseline) or blast (cycle) when adding panels to enable personal
          baseline comparisons alongside standard reference ranges.
        </p>
      </Card>
    );
  }

  const {
    current_phase,
    latest_cruise_report,
    latest_blast_report,
    has_cruise_baseline,
    markers_outside_clinical_range,
    markers_changed_from_baseline,
    markers_worsened_during_blast,
    markers_improved_since_last_test,
    educational_explanation,
    return_to_baseline_note,
    cruise_cycle,
    blast_cycle,
    marker_differences,
    analysis,
  } = comparison;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">Cruise vs Blast Analysis</h2>

      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-muted">Current phase:</span>
          {current_phase === "cruise" || current_phase === "blast" ? (
            <Badge variant={current_phase === "cruise" ? "primary" : "warning"}>
              {formatBloodworkPhase(current_phase)}
            </Badge>
          ) : (
            <Badge variant="default">Not set</Badge>
          )}
          {has_cruise_baseline && (
            <Badge variant="primary" size="sm">
              Baseline established
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted mb-4">{analysis}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted mb-4">
          <div>
            <span className="font-medium text-foreground">Latest cruise: </span>
            {latest_cruise_report
              ? `${latest_cruise_report.report_name} (${latest_cruise_report.collection_date})`
              : "None logged"}
          </div>
          <div>
            <span className="font-medium text-foreground">Latest blast: </span>
            {latest_blast_report
              ? `${latest_blast_report.report_name} (${latest_blast_report.collection_date})`
              : "None logged"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarkerList
            title="Outside clinical reference range"
            items={markers_outside_clinical_range}
            empty="No markers outside supplied reference ranges on the current panel."
          />
          <MarkerList
            title="Changed from cruise baseline"
            items={markers_changed_from_baseline.map((m) => ({
              marker_name: m.marker_name,
              note: m.note,
            }))}
            empty={
              has_cruise_baseline
                ? "No notable changes from cruise baseline on the latest panel."
                : "Add cruise bloodwork to establish a personal baseline."
            }
          />
          <MarkerList
            title="Worsened during blast"
            items={markers_worsened_during_blast}
            empty="No markers flagged as worsened vs cruise baseline."
          />
          <MarkerList
            title="Improved since last test"
            items={markers_improved_since_last_test}
            empty="No improvements detected vs your previous panel in the same phase."
          />
        </div>
      </Card>

      <Card variant="bordered" padding="md">
        <h3 className="text-sm font-semibold text-foreground mb-2">Why markers may shift</h3>
        <p className="text-sm text-muted leading-relaxed">{educational_explanation}</p>
        <p className="text-sm text-muted leading-relaxed mt-3">{return_to_baseline_note}</p>
      </Card>

      {(cruise_cycle || blast_cycle) && marker_differences.length > 0 && (
        <Card variant="bordered" padding="md">
          <h3 className="text-sm font-semibold text-foreground mb-2">Cycle context (educational)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {cruise_cycle && (
              <div>
                <Badge variant="primary" size="sm" className="mb-1">
                  Cruise cycle
                </Badge>
                <p className="text-xs text-muted">{cruise_cycle.cycle_name}</p>
              </div>
            )}
            {blast_cycle && (
              <div>
                <Badge variant="warning" size="sm" className="mb-1">
                  Blast cycle
                </Badge>
                <p className="text-xs text-muted">{blast_cycle.cycle_name}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {marker_differences.slice(0, 6).map((d) => (
              <div key={d.marker_name} className="text-xs text-muted border-t border-border/30 pt-2">
                <strong className="text-foreground">{d.marker_name}:</strong> Cruise{" "}
                {d.cruise_value ?? "—"} → Blast {d.blast_value ?? "—"} {d.unit}. {d.note}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
