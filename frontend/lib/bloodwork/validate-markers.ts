import { calculateStatus } from "@/lib/bloodwork/status";
import type { BloodworkResultInput, BloodworkStatus } from "@/types/bloodwork";
import { formatRefRange } from "@/utils/bloodwork";

/** Validated marker shape used before database insert. */
export interface ValidatedExtractedMarker {
  marker_name: string;
  result_value: number;
  unit: string;
  reference_range: string | null;
  status: BloodworkStatus | null;
}

export interface MarkerValidationSkip {
  reason: string;
  marker: unknown;
}

export interface PreparedBloodworkMarkers {
  valid: BloodworkResultInput[];
  skipped: MarkerValidationSkip[];
}

function trimString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeMarkerKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Adapt parser / AI output when field names differ between versions. */
export function adaptRawExtractedMarker(raw: unknown): Partial<BloodworkResultInput> | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const markerName =
    trimString(row.marker_name) ??
    trimString(row.marker) ??
    trimString(row.name) ??
    trimString(row.raw_name);

  const numericValue =
    toFiniteNumber(row.numeric_value) ??
    toFiniteNumber(row.result_value) ??
    toFiniteNumber(row.value);

  const rangeLow =
    toFiniteNumber(row.range_low) ?? toFiniteNumber(row.reference_low);
  const rangeHigh =
    toFiniteNumber(row.range_high) ?? toFiniteNumber(row.reference_high);

  const unit = trimString(row.unit) ?? trimString(row.units) ?? "";
  const panel =
    trimString(row.panel) ?? trimString(row.category) ?? "Other";
  const resultText =
    trimString(row.result) ??
    trimString(row.result_text) ??
    (numericValue != null ? String(numericValue) : null);

  let referenceRange = trimString(row.reference_range);
  if (!referenceRange && (rangeLow != null || rangeHigh != null)) {
    referenceRange = formatRefRange(rangeLow, rangeHigh, unit);
  }

  if (!markerName || numericValue == null) return null;

  return {
    marker_name: markerName,
    marker: markerName,
    category: panel,
    panel,
    result_value: numericValue,
    numeric_value: numericValue,
    unit,
    reference_low: rangeLow,
    reference_high: rangeHigh,
    range_low: rangeLow,
    range_high: rangeHigh,
    result: resultText,
    result_text: resultText,
    reference_range: referenceRange,
    comparator: trimString(row.comparator),
    flag: trimString(row.flag),
    status:
      row.status === "Low" || row.status === "Normal" || row.status === "High"
        ? row.status
        : undefined,
  };
}

export function toValidatedExtractedMarker(
  input: BloodworkResultInput
): ValidatedExtractedMarker | null {
  const adapted = adaptRawExtractedMarker(input);
  if (!adapted?.marker_name || adapted.result_value == null) return null;

  const marker_name = adapted.marker_name;
  const result_value = adapted.result_value;
  const unit = adapted.unit ?? "";
  const reference_low = adapted.reference_low ?? null;
  const reference_high = adapted.reference_high ?? null;
  const reference_range =
    adapted.reference_range?.trim() ||
    (reference_low != null || reference_high != null
      ? formatRefRange(reference_low, reference_high, unit)
      : null);

  const status =
    adapted.status !== undefined
      ? adapted.status
      : calculateStatus(result_value, reference_low, reference_high);

  return {
    marker_name,
    result_value,
    unit,
    reference_range,
    status,
  };
}

export function validatedToBloodworkResultInput(
  validated: ValidatedExtractedMarker,
  source: Partial<BloodworkResultInput> = {}
): BloodworkResultInput {
  const rangeLow = source.range_low ?? source.reference_low ?? null;
  const rangeHigh = source.range_high ?? source.reference_high ?? null;

  return {
    marker_name: validated.marker_name,
    marker: validated.marker_name,
    category: source.category?.trim() || source.panel?.trim() || "Other",
    panel: source.panel?.trim() || source.category?.trim() || "Other",
    result_value: validated.result_value,
    numeric_value: validated.result_value,
    unit: validated.unit,
    reference_low: rangeLow,
    reference_high: rangeHigh,
    range_low: rangeLow,
    range_high: rangeHigh,
    status: validated.status,
    result: source.result?.trim() || source.result_text?.trim() || String(validated.result_value),
    result_text: source.result_text?.trim() || source.result?.trim() || String(validated.result_value),
    reference_range: validated.reference_range,
    comparator: source.comparator ?? null,
    flag: source.flag ?? null,
  };
}

/** Validate, trim, dedupe, and drop markers that cannot be inserted safely. */
export function prepareMarkersForInsert(
  markers: Array<BloodworkResultInput | Partial<BloodworkResultInput> | unknown>
): PreparedBloodworkMarkers {
  const valid: BloodworkResultInput[] = [];
  const skipped: MarkerValidationSkip[] = [];
  const seen = new Set<string>();

  for (const marker of markers) {
    const adapted = adaptRawExtractedMarker(marker);
    if (!adapted) {
      skipped.push({ reason: "Missing marker name or numeric result", marker });
      continue;
    }

    const validated = toValidatedExtractedMarker(adapted as BloodworkResultInput);
    if (!validated) {
      skipped.push({ reason: "Failed validation after adaptation", marker });
      continue;
    }

    const dedupeKey = normalizeMarkerKey(validated.marker_name);
    if (seen.has(dedupeKey)) {
      skipped.push({ reason: "Duplicate marker", marker: validated.marker_name });
      continue;
    }
    seen.add(dedupeKey);

    valid.push(validatedToBloodworkResultInput(validated, adapted));
  }

  return { valid, skipped };
}
