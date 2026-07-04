import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";
import { toBloodworkStatus } from "@/lib/bloodwork/detect-marker-status";
import type { BloodworkResultInput } from "@/types/bloodwork";
import { runStrictExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";

export function parsedMarkersToInputs(parsed: ParsedBloodworkMarker[]): BloodworkResultInput[] {
  return runStrictExtractionPipeline(parsed).validMarkers;
}

export function buildExtractionSnapshot(parsed: ParsedBloodworkMarker[]) {
  return parsed.map((m) => ({
    panel: m.panel,
    marker: m.marker,
    result: m.result,
    numeric_value: m.numeric_value,
    comparator: m.comparator,
    flag: m.flag,
    unit: m.unit ?? "",
    reference_range: m.reference_range,
    range_low: m.range_low,
    range_high: m.range_high,
    status: m.status,
    bloodwork_status: toBloodworkStatus(m.status),
  }));
}
