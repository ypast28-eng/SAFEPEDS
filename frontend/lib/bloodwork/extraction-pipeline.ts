import type { BloodMarker, BloodworkResultInput } from "@/types/bloodwork";
import {
  matchExtractedMarkers,
  type MatchedExtractedMarker,
  type RawExtractedMarker,
} from "@/lib/bloodwork/match-markers";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";

export function matchedMarkersToInputs(markers: MatchedExtractedMarker[]): BloodworkResultInput[] {
  return markers.map((m) => ({
    panel: m.category,
    marker: m.marker_name,
    result: m.result_text ?? String(m.result_value),
    numeric_value: m.result_value,
    range_low: m.reference_low,
    range_high: m.reference_high,
    marker_name: m.marker_name,
    category: m.category,
    result_value: m.result_value,
    unit: m.unit,
    reference_low: m.reference_low,
    reference_high: m.reference_high,
    status: m.status,
    result_text: m.result_text,
    comparator: m.comparator,
    flag: m.flag,
    reference_range: m.reference_range,
  }));
}

export function runExtractionPipeline(
  rawMarkers: RawExtractedMarker[],
  catalog: BloodMarker[]
) {
  const matched = matchExtractedMarkers(rawMarkers, catalog);
  const mappedMarkers = matchedMarkersToInputs(matched);
  const { valid, skipped } = prepareMarkersForInsert(mappedMarkers);

  return {
    matched,
    mappedMarkers,
    validMarkers: valid,
    skipped,
    matchedCount: matched.filter((m) => m.matched).length,
  };
}
