import { calculateStatus } from "@/lib/bloodwork/status";
import {
  isApprovedBloodworkMarker,
  isApprovedCategoryName,
  isCategoryHeadingName,
  normalizeBloodworkKey,
  resolveApprovedMarkerName,
  stripUnitsFromMarkerText,
  toDisplayMarkerName,
  type ApprovedBloodworkCategory,
} from "@/lib/bloodwork/approved-markers";
import type { BloodworkResultInput, BloodworkStatus } from "@/types/bloodwork";

/** Validated marker shape used before database insert. */
export interface ValidatedExtractedMarker {
  category: string;
  marker_name: string;
  result_value: string;
  units: string | null;
  reference_range: string | null;
  status: BloodworkStatus | null;
  numeric_value: number;
}

export interface MarkerValidationSkip {
  reason: string;
  marker: unknown;
}

export interface PreparedBloodworkMarkers {
  valid: BloodworkResultInput[];
  validated: ValidatedExtractedMarker[];
  skipped: MarkerValidationSkip[];
}

function trimString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseResultValue(raw: unknown): { display: string; numeric: number } | null {
  const text = trimString(raw);
  if (!text) return null;

  const comparatorWithFlag = text.match(/^([<>]=?)\s*(\d+\.?\d*)\s+([HL])$/i);
  if (comparatorWithFlag) {
    const numeric = Number(comparatorWithFlag[2]);
    if (!Number.isFinite(numeric)) return null;
    return {
      display: `${comparatorWithFlag[1]}${comparatorWithFlag[2]} ${comparatorWithFlag[3].toUpperCase()}`,
      numeric,
    };
  }

  const comparatorMatch = text.match(/^([<>]=?)\s*(\d+\.?\d*)$/);
  if (comparatorMatch) {
    const numeric = Number(comparatorMatch[2]);
    if (!Number.isFinite(numeric)) return null;
    return { display: `${comparatorMatch[1]}${comparatorMatch[2]}`, numeric };
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return { display: text, numeric };
  }

  return null;
}

function normalizeReferenceRange(value: unknown): string | null {
  return trimString(value);
}

/** Adapt parser / AI output when field names differ between versions. */
export function adaptRawExtractedMarker(raw: unknown): Partial<BloodworkResultInput> | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const category = trimString(row.category) ?? trimString(row.panel) ?? null;
  if (!category || !isApprovedCategoryName(category)) return null;

  let markerName =
    trimString(row.marker_name) ??
    trimString(row.marker) ??
    trimString(row.name) ??
    trimString(row.raw_name);

  if (!markerName) return null;
  markerName = stripUnitsFromMarkerText(markerName);

  const canonical = resolveApprovedMarkerName(markerName, category as ApprovedBloodworkCategory);
  if (!canonical) return null;
  const displayName = toDisplayMarkerName(canonical);

  const resultText =
    trimString(row.result) ??
    trimString(row.result_text) ??
    trimString(row.result_value);

  const parsedResult = parseResultValue(resultText ?? row.numeric_value ?? row.result_value ?? row.value);
  if (!parsedResult) return null;

  const units = trimString(row.unit) ?? trimString(row.units);
  const referenceRange = normalizeReferenceRange(row.reference_range);
  const rangeLow =
    row.range_low != null ? Number(row.range_low) : row.reference_low != null ? Number(row.reference_low) : null;
  const rangeHigh =
    row.range_high != null ? Number(row.range_high) : row.reference_high != null ? Number(row.reference_high) : null;

  return {
    marker_name: displayName,
    marker: displayName,
    category,
    panel: category,
    result_value: parsedResult.numeric,
    numeric_value: parsedResult.numeric,
    unit: units ?? "",
    reference_low: Number.isFinite(rangeLow) ? rangeLow : null,
    reference_high: Number.isFinite(rangeHigh) ? rangeHigh : null,
    range_low: Number.isFinite(rangeLow) ? rangeLow : null,
    range_high: Number.isFinite(rangeHigh) ? rangeHigh : null,
    result: parsedResult.display,
    result_text: parsedResult.display,
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
  if (!adapted?.marker_name || adapted.result_value == null || !adapted.category) return null;

  const category = adapted.category;
  const marker_name = adapted.marker_name;
  const numeric_value = adapted.result_value;
  const result_value = adapted.result?.trim() || adapted.result_text?.trim() || String(numeric_value);
  const units = adapted.unit?.trim() ? adapted.unit.trim() : null;
  const reference_low = adapted.reference_low ?? null;
  const reference_high = adapted.reference_high ?? null;
  const reference_range =
    adapted.reference_range?.trim() ||
    (reference_low != null || reference_high != null
      ? [reference_low, reference_high]
          .filter((v) => v != null)
          .join(" - ")
      : null);

  const status =
    adapted.status !== undefined
      ? adapted.status
      : calculateStatus(numeric_value, reference_low, reference_high);

  return {
    category,
    marker_name,
    result_value,
    units,
    reference_range,
    status,
    numeric_value,
  };
}

export function validatedToBloodworkResultInput(
  validated: ValidatedExtractedMarker,
  source: Partial<BloodworkResultInput> = {}
): BloodworkResultInput {
  return {
    marker_name: validated.marker_name,
    marker: validated.marker_name,
    category: validated.category,
    panel: validated.category,
    result_value: validated.numeric_value,
    numeric_value: validated.numeric_value,
    unit: validated.units ?? "",
    reference_low: source.reference_low ?? source.range_low ?? null,
    reference_high: source.reference_high ?? source.range_high ?? null,
    range_low: source.range_low ?? source.reference_low ?? null,
    range_high: source.range_high ?? source.reference_high ?? null,
    status: validated.status,
    result: validated.result_value,
    result_text: validated.result_value,
    reference_range: validated.reference_range,
    comparator: source.comparator ?? null,
    flag: source.flag ?? null,
  };
}

/** Validate, trim, dedupe by category+marker, and keep only approved markers. */
export function prepareMarkersForInsert(
  markers: Array<BloodworkResultInput | Partial<BloodworkResultInput> | unknown>
): PreparedBloodworkMarkers {
  const valid: BloodworkResultInput[] = [];
  const validated: ValidatedExtractedMarker[] = [];
  const skipped: MarkerValidationSkip[] = [];
  const seen = new Set<string>();

  for (const marker of markers) {
    const adapted = adaptRawExtractedMarker(marker);
    if (!adapted?.marker_name) {
      skipped.push({ reason: "Missing or unapproved marker name", marker });
      continue;
    }

    if (isCategoryHeadingName(adapted.marker_name)) {
      skipped.push({ reason: "Marker name is a category heading", marker: adapted.marker_name });
      continue;
    }

    if (!isApprovedBloodworkMarker(adapted.category!, adapted.marker_name)) {
      skipped.push({ reason: "Marker not in approved list", marker: adapted.marker_name });
      continue;
    }

    const validatedMarker = toValidatedExtractedMarker(adapted as BloodworkResultInput);
    if (!validatedMarker) {
      skipped.push({ reason: "Missing result value or failed validation", marker });
      continue;
    }

    const dedupeKey = `${normalizeBloodworkKey(validatedMarker.category)}::${normalizeBloodworkKey(validatedMarker.marker_name)}`;
    if (seen.has(dedupeKey)) {
      skipped.push({
        reason: "Duplicate marker in category",
        marker: `${validatedMarker.category} / ${validatedMarker.marker_name}`,
      });
      continue;
    }
    seen.add(dedupeKey);

    validated.push(validatedMarker);
    valid.push(validatedToBloodworkResultInput(validatedMarker, adapted));
  }

  return { valid, validated, skipped };
}
