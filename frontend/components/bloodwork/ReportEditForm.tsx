"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, X, CheckCircle2 } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { BloodworkPhaseSelector } from "./BloodworkPhaseSelector";
import { useBloodMarkers } from "@/hooks/useBloodMarkers";
import { updateBloodworkReport } from "@/services/bloodwork";
import { calculateStatus } from "@/lib/bloodwork/status";
import { resolveBloodworkPhase } from "@/lib/bloodwork/phase";
import type {
  BloodworkPhaseInput,
  BloodworkReportWithResults,
  BloodworkStatus,
  EditableBloodworkResultInput,
} from "@/types/bloodwork";

interface EditResultRow {
  localId: string;
  resultId?: string;
  marker_id: string;
  marker_name: string;
  category: string;
  result_value: string;
  unit: string;
  reference_low: string;
  reference_high: string;
  status: BloodworkStatus | "" | "auto";
}

const STATUS_OPTIONS = [
  { label: "Auto (from reference range)", value: "auto" },
  { label: "Low", value: "Low" },
  { label: "Normal", value: "Normal" },
  { label: "High", value: "High" },
];

function emptyRow(): EditResultRow {
  return {
    localId: crypto.randomUUID(),
    marker_id: "",
    marker_name: "",
    category: "",
    result_value: "",
    unit: "",
    reference_low: "",
    reference_high: "",
    status: "auto",
  };
}

function rowsFromReport(
  report: BloodworkReportWithResults,
  markers: { id: string; name: string; category: string }[]
): EditResultRow[] {
  if (report.bloodwork_results.length === 0) return [emptyRow()];

  return report.bloodwork_results.map((r) => {
    const marker = markers.find((m) => m.name === r.marker_name);
    return {
      localId: crypto.randomUUID(),
      resultId: r.id,
      marker_id: marker?.id ?? "",
      marker_name: r.marker_name,
      category: r.category,
      result_value: String(r.result_value),
      unit: r.unit,
      reference_low: r.reference_low != null ? String(r.reference_low) : "",
      reference_high: r.reference_high != null ? String(r.reference_high) : "",
      status: r.status ?? "auto",
    };
  });
}

interface ReportEditFormProps {
  report: BloodworkReportWithResults;
  onCancel: () => void;
  onSaved: () => void;
}

export function ReportEditForm({ report, onCancel, onSaved }: ReportEditFormProps) {
  const { markers, isLoading: markersLoading } = useBloodMarkers();
  const [reportName, setReportName] = useState(report.report_name);
  const [labName, setLabName] = useState(report.lab_name ?? "");
  const [collectionDate, setCollectionDate] = useState(report.collection_date);
  const [notes, setNotes] = useState(report.notes ?? "");
  const [phase, setPhase] = useState<BloodworkPhaseInput>(resolveBloodworkPhase(report.phase));
  const [rows, setRows] = useState<EditResultRow[]>(() => rowsFromReport(report, []));
  const [deletedResultIds, setDeletedResultIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || markersLoading) return;
    setRows(rowsFromReport(report, markers));
    setInitialized(true);
  }, [initialized, markersLoading, markers, report]);

  const markerOptions = useMemo(
    () => markers.map((m) => ({ label: `${m.name} (${m.category})`, value: m.id })),
    [markers]
  );

  function updateRow(localId: string, patch: Partial<EditResultRow>) {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  }

  function onMarkerSelect(localId: string, markerId: string) {
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return;
    updateRow(localId, {
      marker_id: markerId,
      marker_name: marker.name,
      category: marker.category,
      unit: marker.default_unit ?? "",
      reference_low: marker.default_reference_low?.toString() ?? "",
      reference_high: marker.default_reference_high?.toString() ?? "",
    });
  }

  function removeRow(row: EditResultRow) {
    if (row.resultId) {
      setDeletedResultIds((prev) => [...prev, row.resultId!]);
    }
    setRows((prev) => {
      const next = prev.filter((r) => r.localId !== row.localId);
      return next.length > 0 ? next : [emptyRow()];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!reportName.trim()) {
      setError("Report name is required.");
      return;
    }
    if (!collectionDate) {
      setError("Collection date is required.");
      return;
    }
    if (!phase) {
      setError("Please select a bloodwork phase.");
      return;
    }

    const results: EditableBloodworkResultInput[] = [];

    for (const row of rows) {
      const name = row.marker_name.trim() || markers.find((m) => m.id === row.marker_id)?.name;
      if (!name || !row.result_value.trim()) continue;

      const value = parseFloat(row.result_value);
      if (Number.isNaN(value)) {
        setError(`Invalid value for ${name}.`);
        return;
      }

      const refLow = row.reference_low ? parseFloat(row.reference_low) : null;
      const refHigh = row.reference_high ? parseFloat(row.reference_high) : null;
      const autoStatus = calculateStatus(value, refLow, refHigh);
      const status: BloodworkStatus | null =
        row.status === "auto" || row.status === ""
          ? autoStatus
          : row.status;

      const marker = markers.find((m) => m.id === row.marker_id);
      results.push({
        id: row.resultId,
        marker_name: name,
        category: row.category.trim() || marker?.category || "General",
        result_value: value,
        unit: row.unit.trim() || marker?.default_unit || "",
        reference_low: refLow,
        reference_high: refHigh,
        status,
      });
    }

    setIsSaving(true);

    const { error: saveError } = await updateBloodworkReport(report.id, {
      report_name: reportName,
      lab_name: labName || null,
      collection_date: collectionDate,
      notes: notes || null,
      phase: resolveBloodworkPhase(phase),
      results,
      deleted_result_ids: deletedResultIds,
    });

    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    setSuccessMessage("Report saved successfully.");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card variant="elevated" padding="lg">
        <h2 className="text-base font-semibold text-foreground mb-4">Edit Report Details</h2>
        <div className="space-y-6">
          <BloodworkPhaseSelector value={phase} onChange={setPhase} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Report Name"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            required
          />
          <Input
            label="Laboratory Name"
            placeholder="e.g. Quest Diagnostics"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
          />
          <Input
            label="Collection Date"
            type="date"
            value={collectionDate}
            onChange={(e) => setCollectionDate(e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Optional notes about this panel…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Marker Results</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            disabled={markersLoading}
          >
            <Plus className="h-4 w-4" />
            Add Marker
          </Button>
        </div>

        <div className="space-y-4">
          {rows.map((row) => (
            <div
              key={row.localId}
              className="p-4 rounded-xl border border-border/50 bg-surface/50 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select
                  label="Quick-fill from catalog"
                  value={row.marker_id}
                  onChange={(e) => onMarkerSelect(row.localId, e.target.value)}
                  options={markerOptions}
                  placeholder="Select marker…"
                />
                <Input
                  label="Marker Name"
                  value={row.marker_name}
                  onChange={(e) => updateRow(row.localId, { marker_name: e.target.value })}
                  placeholder="e.g. ALT"
                  required
                />
                <Input
                  label="Category"
                  value={row.category}
                  onChange={(e) => updateRow(row.localId, { category: e.target.value })}
                  placeholder="e.g. Liver"
                />
                <Input
                  label="Result Value"
                  type="number"
                  step="any"
                  value={row.result_value}
                  onChange={(e) => updateRow(row.localId, { result_value: e.target.value })}
                  required
                />
                <Input
                  label="Unit"
                  value={row.unit}
                  onChange={(e) => updateRow(row.localId, { unit: e.target.value })}
                  placeholder="e.g. U/L"
                />
                <Input
                  label="Reference Low"
                  type="number"
                  step="any"
                  value={row.reference_low}
                  onChange={(e) => updateRow(row.localId, { reference_low: e.target.value })}
                />
                <Input
                  label="Reference High"
                  type="number"
                  step="any"
                  value={row.reference_high}
                  onChange={(e) => updateRow(row.localId, { reference_high: e.target.value })}
                />
                <Select
                  label="Status"
                  value={row.status}
                  onChange={(e) =>
                    updateRow(row.localId, {
                      status: e.target.value as EditResultRow["status"],
                    })
                  }
                  options={STATUS_OPTIONS}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row)}
                className="text-muted hover:text-accent"
              >
                <Trash2 className="h-4 w-4" />
                Remove marker
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div role="alert" className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" isLoading={isSaving} className="sm:ml-auto">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
