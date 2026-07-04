import { detectMarkerStatus, type ParsedMarkerStatus } from "@/lib/bloodwork/detect-marker-status";
import {
  type ApprovedBloodworkCategory,
  isJunkTableLine,
  resolveApprovedMarkerName,
  resolveCategoryHeading,
  stripUnitsFromMarkerText,
} from "@/lib/bloodwork/approved-markers";

export interface ParsedBloodworkMarker {
  panel: string;
  marker: string;
  result: string;
  numeric_value: number | null;
  comparator: "<" | ">" | "<=" | ">=" | null;
  flag: "H" | "L" | null;
  unit: string;
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
  status: ParsedMarkerStatus;
}

const UNIT_PATTERN =
  /\b(x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|mL\/min\/1\.73m2|fL|pg|ng\/mL|ng\/dL|%)\b/i;

const RANGE_BOTH = /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*$/;
const RANGE_UPPER = /^([<>]=?)\s*(\d+\.?\d*)\s*$/;
const RANGE_LOWER = /^>\s*(\d+\.?\d*)\s*$/;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(d)))
    .replace(/×/g, "x");
}

function parseReferenceRange(raw: string): {
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
} {
  const ref = raw.trim();
  if (!ref) {
    return { reference_range: "", range_low: null, range_high: null };
  }

  const both = ref.match(RANGE_BOTH);
  if (both) {
    return {
      reference_range: ref,
      range_low: Number(both[1]),
      range_high: Number(both[2]),
    };
  }

  const bound = ref.match(RANGE_UPPER);
  if (bound) {
    const comparator = bound[1];
    const value = Number(bound[2]);
    return {
      reference_range: `${comparator}${bound[2]}`,
      range_low: comparator.startsWith(">") ? value : null,
      range_high: comparator.startsWith("<") ? value : null,
    };
  }

  const lower = ref.match(RANGE_LOWER);
  if (lower) {
    return {
      reference_range: ref,
      range_low: Number(lower[1]),
      range_high: null,
    };
  }

  return { reference_range: ref, range_low: null, range_high: null };
}

function extractReferenceFromEnd(line: string): {
  remainder: string;
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
} {
  const both = line.match(/^(.+?)\s+(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*$/);
  if (both) {
    return {
      remainder: both[1].trim(),
      reference_range: `${both[2]} - ${both[3]}`,
      range_low: Number(both[2]),
      range_high: Number(both[3]),
    };
  }

  const bound = line.match(/^(.+?)\s+([<>]=?)\s*(\d+\.?\d*)\s*$/);
  if (bound) {
    const ref = `${bound[2]}${bound[3]}`;
    const parsed = parseReferenceRange(ref);
    return {
      remainder: bound[1].trim(),
      ...parsed,
    };
  }

  return {
    remainder: line.trim(),
    reference_range: "",
    range_low: null,
    range_high: null,
  };
}

function extractUnitFromEnd(line: string): { remainder: string; unit: string } {
  const match = line.match(new RegExp(`^(.*?)\\s+(${UNIT_PATTERN.source})$`, "i"));
  if (match) {
    return { remainder: match[1].trim(), unit: match[2] };
  }
  return { remainder: line.trim(), unit: "" };
}

function extractFlagFromEnd(line: string): { remainder: string; flag: "H" | "L" | null } {
  const match = line.match(/^(.+?)\s+([HL])\s*$/i);
  if (match) {
    return { remainder: match[1].trim(), flag: match[2].toUpperCase() as "H" | "L" };
  }
  return { remainder: line.trim(), flag: null };
}

function extractResultFromEnd(line: string): {
  marker: string;
  result: string;
  numeric_value: number | null;
  comparator: "<" | ">" | "<=" | ">=" | null;
} {
  const compMatch = line.match(/^(.+?)\s+([<>]=?)\s*(\d+\.?\d*)\s*$/);
  if (compMatch) {
    const comparator = compMatch[2] as "<" | ">" | "<=" | ">=";
    const numeric = Number(compMatch[3]);
    return {
      marker: compMatch[1].trim(),
      result: `${comparator}${compMatch[3]}`,
      numeric_value: Number.isFinite(numeric) ? numeric : null,
      comparator,
    };
  }

  const valueMatch = line.match(/^(.+?)\s+(\d+\.?\d*)\s*$/);
  if (valueMatch) {
    const numeric = Number(valueMatch[2]);
    return {
      marker: valueMatch[1].trim(),
      result: valueMatch[2],
      numeric_value: Number.isFinite(numeric) ? numeric : null,
      comparator: null,
    };
  }

  return {
    marker: line.trim(),
    result: "",
    numeric_value: null,
    comparator: null,
  };
}

/**
 * Parse one pathology table row: [Test Name] [Result] [Units] [Reference Interval]
 */
export function parseMarkerRow(
  line: string,
  category: ApprovedBloodworkCategory
): ParsedBloodworkMarker | null {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (isJunkTableLine(cleaned)) return null;
  if (cleaned.toLowerCase() === "random") return null;

  const { remainder: afterRef, ...range } = extractReferenceFromEnd(cleaned);
  const { remainder: afterUnit, unit } = extractUnitFromEnd(afterRef);
  const { remainder: afterFlag, flag } = extractFlagFromEnd(afterUnit);
  const valueParts = extractResultFromEnd(afterFlag);

  const markerRaw = stripUnitsFromMarkerText(valueParts.marker);
  const canonicalMarker = resolveApprovedMarkerName(markerRaw, category);

  if (!canonicalMarker || valueParts.numeric_value == null || !valueParts.result) {
    return null;
  }

  const status = detectMarkerStatus({
    numeric_value: valueParts.numeric_value,
    comparator: valueParts.comparator,
    flag,
    range_low: range.range_low,
    range_high: range.range_high,
    reference_range: range.reference_range,
  });

  return {
    panel: category,
    marker: canonicalMarker,
    result: valueParts.result,
    numeric_value: valueParts.numeric_value,
    comparator: valueParts.comparator,
    flag,
    unit: unit.trim(),
    reference_range: range.reference_range,
    range_low: range.range_low,
    range_high: range.range_high,
    status,
  };
}

export function parseBloodworkPdfText(text: string): ParsedBloodworkMarker[] {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let currentCategory: ApprovedBloodworkCategory | null = null;
  const markers: ParsedBloodworkMarker[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const heading = resolveCategoryHeading(line);
    if (heading) {
      currentCategory = heading;
      continue;
    }

    if (!currentCategory) continue;

    const parsed = parseMarkerRow(line, currentCategory);
    if (!parsed) continue;

    const key = `${parsed.panel}::${parsed.marker}`;
    if (seen.has(key)) continue;
    seen.add(key);
    markers.push(parsed);
  }

  return markers;
}

export async function parseBloodworkPdfBuffer(buffer: Buffer): Promise<ParsedBloodworkMarker[]> {
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer);
  return parseBloodworkPdfText(parsed.text ?? "");
}
