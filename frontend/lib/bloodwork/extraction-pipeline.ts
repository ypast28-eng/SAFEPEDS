import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";
import type { BloodworkResultInput } from "@/types/bloodwork";
import {
  prepareMarkersForInsert,
  type ValidatedExtractedMarker,
} from "@/lib/bloodwork/validate-markers";

export function parsedMarkersToInputs(parsed: ParsedBloodworkMarker[]): BloodworkResultInput[] {
  const mapped = parsed.map((m) => ({
    category: m.panel,
    panel: m.panel,
    marker_name: m.marker,
    marker: m.marker,
    result_value: m.numeric_value ?? 0,
    numeric_value: m.numeric_value ?? 0,
    unit: m.unit,
    units: m.unit,
    reference_range: m.reference_range,
    range_low: m.range_low,
    range_high: m.range_high,
    reference_low: m.range_low,
    reference_high: m.range_high,
    result: m.result,
    result_text: m.result,
    comparator: m.comparator,
    flag: m.flag,
  }));

  return prepareMarkersForInsert(mapped).valid;
}

export function runStrictExtractionPipeline(parsed: ParsedBloodworkMarker[]) {
  const mappedMarkers = parsed.map((m) => ({
    category: m.panel,
    panel: m.panel,
    marker_name: m.marker,
    marker: m.marker,
    result_value: m.result,
    numeric_value: m.numeric_value,
    unit: m.unit,
    units: m.unit,
    reference_range: m.reference_range,
    range_low: m.range_low,
    range_high: m.range_high,
    reference_low: m.range_low,
    reference_high: m.range_high,
    result: m.result,
    result_text: m.result,
    comparator: m.comparator,
    flag: m.flag,
  }));

  const { valid, validated, skipped } = prepareMarkersForInsert(mappedMarkers);

  return {
    mappedMarkers,
    validMarkers: valid,
    validatedMarkers: validated,
    skippedMarkers: skipped,
  };
}

export type { ValidatedExtractedMarker };
