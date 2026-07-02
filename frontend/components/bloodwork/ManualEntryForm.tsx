"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { useBloodMarkers } from "@/hooks/useBloodMarkers";
import { useAuth } from "@/hooks/useAuth";
import { createReportWithResults, appendResultsToReport } from "@/services/bloodwork";
import type { BloodworkPhaseInput, BloodworkResultInput, ExtractedBloodworkMarker } from "@/types/bloodwork";

interface ResultRow {
  localId: string;
  marker_id: string;
  result_value: string;
  unit: string;
  reference_low: string;
  reference_high: string;
}

const EMPTY_ROW = (): ResultRow => ({
  localId: crypto.randomUUID(),
  marker_id: "",
  result_value: "",
  unit: "",
  reference_low: "",
  reference_high: "",
});

function rowsFromExtracted(
  extracted: ExtractedBloodworkMarker[],
  markers: { id: string; name: string; default_unit: string | null; default_reference_low: number | null; default_reference_high: number | null }[]
): ResultRow[] {
  return extracted.map((item) => {
    const marker =
      (item.marker_id ? markers.find((m) => m.id === item.marker_id) : undefined) ??
      markers.find((m) => m.name === item.marker_name);
    return {
      localId: crypto.randomUUID(),
      marker_id: marker?.id ?? "",
      result_value: String(item.result_value),
      unit: item.unit || marker?.default_unit || "",
      reference_low:
        item.reference_low != null
          ? String(item.reference_low)
          : marker?.default_reference_low?.toString() ?? "",
      reference_high:
        item.reference_high != null
          ? String(item.reference_high)
          : marker?.default_reference_high?.toString() ?? "",
    };
  });
}

export function ManualEntryForm({
  existingReportId,
  phase,
  onPhaseRequired,
  initialExtracted,
  reviewNotice,
  onSaved,
}: {
  existingReportId?: string;
  phase?: BloodworkPhaseInput | null;
  onPhaseRequired?: () => void;
  initialExtracted?: ExtractedBloodworkMarker[];
  reviewNotice?: string | null;
  onSaved?: () => void;
} = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const { markers, isLoading: markersLoading } = useBloodMarkers();
  const [reportName, setReportName] = useState("");
  const [labName, setLabName] = useState("");
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ResultRow[]>([EMPTY_ROW()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !initialExtracted?.length || markersLoading) return;
    setRows(rowsFromExtracted(initialExtracted, markers));
    setInitialized(true);
  }, [initialExtracted, markers, markersLoading, initialized]);

  const markerOptions = markers.map((m) => ({
    label: `${m.name} (${m.category})`,
    value: m.id,
  }));

  function updateRow(localId: string, patch: Partial<ResultRow>) {
    setRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  }

  function onMarkerSelect(localId: string, markerId: string) {
    const marker = markers.find((m) => m.id === markerId);
    updateRow(localId, {
      marker_id: markerId,
      unit: marker?.default_unit ?? "",
      reference_low: marker?.default_reference_low?.toString() ?? "",
      reference_high: marker?.default_reference_high?.toString() ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in.");
      return;
    }
    if (!existingReportId && !reportName.trim()) {
      setError("Please enter a report name.");
      return;
    }
    if (!collectionDate) {
      setError("Please enter a collection date.");
      return;
    }
    if (!existingReportId && !phase) {
      setError("Please select whether this bloodwork was taken during cruise or blast.");
      return;
    }

    const results: BloodworkResultInput[] = [];
    for (const row of rows) {
      if (!row.marker_id || !row.result_value) continue;
      const marker = markers.find((m) => m.id === row.marker_id);
      if (!marker) continue;
      const value = parseFloat(row.result_value);
      if (isNaN(value)) {
        setError(`Invalid value for ${marker.name}.`);
        return;
      }
      results.push({
        marker_name: marker.name,
        category: marker.category,
        result_value: value,
        unit: row.unit || marker.default_unit || "",
        reference_low: row.reference_low ? parseFloat(row.reference_low) : null,
        reference_high: row.reference_high ? parseFloat(row.reference_high) : null,
      });
    }

    if (results.length === 0) {
      setError("Add at least one marker result.");
      return;
    }

    setIsSaving(true);

    if (existingReportId) {
      const { error: appendError } = await appendResultsToReport(existingReportId, results);
      setIsSaving(false);
      if (appendError) {
        setError(appendError);
        return;
      }
      if (onSaved) {
        onSaved();
        return;
      }
      router.push(`/bloodwork/reports/${existingReportId}`);
      router.refresh();
      return;
    }

    const { data, error: saveError } = await createReportWithResults(user.id, {
      report_name: reportName,
      lab_name: labName,
      collection_date: collectionDate,
      phase: phase!,
      notes,
      results,
    });
    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    router.push(data ? `/bloodwork/reports/${data.id}` : "/bloodwork");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {reviewNotice && (
        <Card variant="bordered" padding="md" className="border-primary/20 bg-primary/5">
          <p className="text-sm text-muted whitespace-pre-line">{reviewNotice}</p>
        </Card>
      )}
      {!existingReportId && (
        <Card variant="elevated" padding="lg">
          <h3 className="text-base font-semibold text-foreground mb-4">Report Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Report Name"
              placeholder="e.g. Q1 2026 Panel"
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
        </Card>
      )}

      <Card variant="elevated" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Marker Results</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRows((prev) => [...prev, EMPTY_ROW()])}
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
              className="p-4 rounded-xl border border-border/50 bg-surface/50 space-y-3 animate-fade-slide-up"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Select
                  label="Marker"
                  value={row.marker_id}
                  onChange={(e) => onMarkerSelect(row.localId, e.target.value)}
                  options={markerOptions}
                  placeholder="Select marker…"
                  required
                />
                <Input
                  label="Result Value"
                  type="number"
                  step="any"
                  placeholder="Value"
                  value={row.result_value}
                  onChange={(e) => updateRow(row.localId, { result_value: e.target.value })}
                  required
                />
                <Input
                  label="Unit"
                  placeholder="e.g. mg/dL"
                  value={row.unit}
                  onChange={(e) => updateRow(row.localId, { unit: e.target.value })}
                />
                <Input
                  label="Reference Low"
                  type="number"
                  step="any"
                  placeholder="Lab ref low"
                  value={row.reference_low}
                  onChange={(e) => updateRow(row.localId, { reference_low: e.target.value })}
                />
                <Input
                  label="Reference High"
                  type="number"
                  step="any"
                  placeholder="Lab ref high"
                  value={row.reference_high}
                  onChange={(e) => updateRow(row.localId, { reference_high: e.target.value })}
                />
              </div>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((prev) => prev.filter((r) => r.localId !== row.localId))}
                  className="text-muted hover:text-accent"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div role="alert" className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/bloodwork">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button type="submit" isLoading={isSaving} className="sm:ml-auto">
          <Save className="h-4 w-4" />
          {existingReportId && initialExtracted?.length ? "Save extracted markers" : "Save Report"}
        </Button>
      </div>
    </form>
  );
}
