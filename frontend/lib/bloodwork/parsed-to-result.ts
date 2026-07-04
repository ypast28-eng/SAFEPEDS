import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";
import { toBloodworkStatus } from "@/lib/bloodwork/detect-marker-status";
import type { BloodMarker, BloodworkResultInput } from "@/types/bloodwork";
import { matchExtractedMarkers, type RawExtractedMarker } from "@/lib/bloodwork/match-markers";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";

export function parsedMarkerToRaw(marker: ParsedBloodworkMarker): RawExtractedMarker {
  if (marker.numeric_value == null) {
    return {
      name: marker.marker,
      value: Number.NaN,
      unit: marker.unit,
      reference_low: marker.range_low,
      reference_high: marker.range_high,
      panel: marker.panel,
      result_text: marker.result,
      comparator: marker.comparator,
      flag: marker.flag,
      reference_range: marker.reference_range,
      parsed_status: marker.status,
    };
  }

  return {
    name: marker.marker,
    value: marker.numeric_value,
    unit: marker.unit,
    reference_low: marker.range_low,
    reference_high: marker.range_high,
    panel: marker.panel,
    result_text: marker.result,
    comparator: marker.comparator,
    flag: marker.flag,
    reference_range: marker.reference_range,
    parsed_status: marker.status,
  };
}

export function parsedMarkersToInputs(
  parsed: ParsedBloodworkMarker[],
  catalog: BloodMarker[]
): BloodworkResultInput[] {
  const raw = parsed.map(parsedMarkerToRaw);
  const matched = matchExtractedMarkers(raw, catalog);
  const mapped = matched.map((m) => ({
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

  return prepareMarkersForInsert(mapped).valid;
}

export function buildExtractionSnapshot(parsed: ParsedBloodworkMarker[]) {
  return parsed.map((m) => ({
    panel: m.panel,
    marker: m.marker,
    result: m.result,
    numeric_value: m.numeric_value,
    comparator: m.comparator,
    flag: m.flag,
    unit: m.unit,
    reference_range: m.reference_range,
    range_low: m.range_low,
    range_high: m.range_high,
    status: m.status,
    bloodwork_status: toBloodworkStatus(m.status),
  }));
}
