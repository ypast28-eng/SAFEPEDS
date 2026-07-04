import { detectMarkerStatus, type ParsedMarkerStatus } from "@/lib/bloodwork/detect-marker-status";
import {
  type ApprovedBloodworkCategory,
  APPROVED_BLOODWORK_CATEGORIES,
  getMarkerSearchPatterns,
  isJunkTableLine,
  resolveApprovedMarkerName,
  resolveCategoryHeading,
  stripUnitsFromMarkerText,
  toDisplayMarkerName,
} from "@/lib/bloodwork/approved-markers";
import {
  EXPECTED_CLINIPATH_MARKER_COUNT,
  getMissingClinipathMarkerNames,
  mergeClinipathMarkers,
  parseClinipathPdfText,
} from "@/lib/bloodwork/clinipath-parser";
import { extractClinipathFallbackMarkers } from "@/lib/bloodwork/clinipath-fallback-parser";
import { extractPdfTextByPage } from "@/lib/bloodwork/pdf-page-extract";

export interface ParsedBloodworkMarker {
  panel: string;
  marker: string;
  result: string;
  numeric_value: number | null;
  comparator: "<" | ">" | "<=" | ">=" | null;
  flag: "H" | "L" | null;
  unit: string | null;
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
  status: ParsedMarkerStatus;
}

export interface ExtractedSectionTable {
  category: ApprovedBloodworkCategory;
  lines: string[];
}

const UNIT_PATTERN =
  /\b(x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|mL\/min\/1\.73m2|fL|pg|ng\/mL|ng\/dL|%)\b/i;

const RANGE_BOTH = /^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*$/;
const RANGE_UPPER = /^([<>]=?)\s*(\d+\.?\d*)\s*$/;
const RANGE_LOWER = /^>\s*(\d+\.?\d*)\s*$/;

const RESULT_TOKEN =
  /^(?:([<>]=?)\s*(\d+\.?\d*)(?:\s+([HL]))?|(\d+\.?\d*))\s*(.*)$/i;

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

function extractUnitToken(line: string): { remainder: string; unit: string | null } {
  const match = line.match(new RegExp(`^(.*?)\\s+(${UNIT_PATTERN.source})\\s*$`, "i"));
  if (match) {
    return { remainder: match[1].trim(), unit: match[2] };
  }
  return { remainder: line.trim(), unit: null };
}

function parseResultToken(raw: string): {
  result: string;
  numeric_value: number | null;
  comparator: "<" | ">" | "<=" | ">=" | null;
  flag: "H" | "L" | null;
  remainder: string;
} | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(RESULT_TOKEN);
  if (!match) return null;

  if (match[1] != null && match[2] != null) {
    const comparator = match[1] as "<" | ">" | "<=" | ">=";
    const numeric = Number(match[2]);
    const flag = match[3]?.toUpperCase() as "H" | "L" | undefined;
    const result = flag ? `${comparator}${match[2]} ${flag}` : `${comparator}${match[2]}`;
    return {
      result,
      numeric_value: Number.isFinite(numeric) ? numeric : null,
      comparator,
      flag: flag ?? null,
      remainder: match[4]?.trim() ?? "",
    };
  }

  if (match[4] != null) {
    const numeric = Number(match[4]);
    return {
      result: match[4],
      numeric_value: Number.isFinite(numeric) ? numeric : null,
      comparator: null,
      flag: null,
      remainder: match[5]?.trim() ?? "",
    };
  }

  return null;
}

function findMarkerPrefix(
  line: string,
  category: ApprovedBloodworkCategory
): { canonical: string; remainder: string } | null {
  const cleaned = stripUnitsFromMarkerText(line.replace(/\s+/g, " ").trim());
  const patterns = getMarkerSearchPatterns(category);

  for (const { canonical, pattern } of patterns) {
    const match = cleaned.match(pattern);
    if (!match || match.index !== 0) continue;
    return {
      canonical,
      remainder: cleaned.slice(match[0].length).trim(),
    };
  }

  const fallback = resolveApprovedMarkerName(cleaned, category);
  if (fallback) {
    const markerKey = normalizeBloodworkKey(fallback);
    const lineKey = normalizeBloodworkKey(cleaned);
    if (lineKey === markerKey) {
      return { canonical: fallback, remainder: "" };
    }
    if (lineKey.startsWith(`${markerKey} `)) {
      return {
        canonical: fallback,
        remainder: cleaned.slice(cleaned.toLowerCase().indexOf(fallback.toLowerCase()) + fallback.length).trim(),
      };
    }
  }

  return null;
}

function normalizeBloodworkKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9/%+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildParsedMarker(
  category: ApprovedBloodworkCategory,
  canonicalMarker: string,
  result: string,
  numeric_value: number | null,
  comparator: "<" | ">" | "<=" | ">=" | null,
  flag: "H" | "L" | null,
  unit: string | null,
  reference_range: string,
  range_low: number | null,
  range_high: number | null
): ParsedBloodworkMarker {
  const status = detectMarkerStatus({
    numeric_value,
    comparator,
    flag,
    range_low,
    range_high,
    reference_range,
  });

  return {
    panel: category,
    marker: toDisplayMarkerName(canonicalMarker),
    result,
    numeric_value,
    comparator,
    flag,
    unit: unit?.trim() || null,
    reference_range,
    range_low,
    range_high,
    status,
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

  const markerMatch = findMarkerPrefix(cleaned, category);
  if (!markerMatch) return null;

  let working = markerMatch.remainder;
  if (!working) {
    const withoutName = cleaned.slice(
      cleaned.toLowerCase().indexOf(markerMatch.canonical.toLowerCase()) +
        markerMatch.canonical.length
    ).trim();
    working = withoutName;
  }

  const { remainder: afterRef, ...range } = extractReferenceFromEnd(working);
  const { remainder: afterUnit, unit } = extractUnitToken(afterRef);
  const parsedResult = parseResultToken(afterUnit);

  if (!parsedResult?.result) return null;

  return buildParsedMarker(
    category,
    markerMatch.canonical,
    parsedResult.result,
    parsedResult.numeric_value,
    parsedResult.comparator,
    parsedResult.flag,
    unit,
    range.reference_range,
    range.range_low,
    range.range_high
  );
}

function parseMarkerRowFallback(
  line: string,
  category: ApprovedBloodworkCategory
): ParsedBloodworkMarker | null {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (isJunkTableLine(cleaned)) return null;

  for (const { canonical, pattern } of getMarkerSearchPatterns(category)) {
    const markerMatch = cleaned.match(new RegExp(`${pattern.source}\\s+(.+)$`, "i"));
    if (!markerMatch) continue;

    let tail = markerMatch[1].trim();
    const { remainder: afterRef, ...range } = extractReferenceFromEnd(tail);
    tail = afterRef;
    const { remainder: afterUnit, unit } = extractUnitToken(tail);
    const parsedResult = parseResultToken(afterUnit);

    if (!parsedResult?.result) continue;

    return buildParsedMarker(
      category,
      canonical,
      parsedResult.result,
      parsedResult.numeric_value,
      parsedResult.comparator,
      parsedResult.flag,
      unit,
      range.reference_range,
      range.range_low,
      range.range_high
    );
  }

  return null;
}

export function extractSectionTables(text: string): ExtractedSectionTable[] {
  const normalized = normalizeText(text);
  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const tables: ExtractedSectionTable[] = [];
  let currentCategory: ApprovedBloodworkCategory | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentCategory && currentLines.length > 0) {
      tables.push({ category: currentCategory, lines: [...currentLines] });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const heading = resolveCategoryHeading(line);
    if (heading) {
      flush();
      currentCategory = heading;
      continue;
    }

    if (!currentCategory) continue;
    if (!APPROVED_BLOODWORK_CATEGORIES.includes(currentCategory)) continue;
    currentLines.push(line);
  }

  flush();
  return tables;
}

function dedupeMarkers(markers: ParsedBloodworkMarker[]): ParsedBloodworkMarker[] {
  const seen = new Set<string>();
  const deduped: ParsedBloodworkMarker[] = [];

  for (const marker of markers) {
    const key = `${marker.panel}::${marker.marker}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(marker);
  }

  return deduped;
}

export function parseStructuredMarkers(text: string): ParsedBloodworkMarker[] {
  const rawText = normalizeText(text);
  const extractedTables = extractSectionTables(rawText);
  const markers: ParsedBloodworkMarker[] = [];

  for (const table of extractedTables) {
    for (const line of table.lines) {
      const parsed = parseMarkerRow(line, table.category) ?? parseMarkerRowFallback(line, table.category);
      if (parsed) markers.push(parsed);
    }
  }

  return dedupeMarkers(markers);
}

export interface BloodworkPdfParseResult {
  rawText: string;
  structuredMarkers: ParsedBloodworkMarker[];
  clinipathMarkers: ParsedBloodworkMarker[];
  fallbackMarkers: ParsedBloodworkMarker[];
  finalMarkers: ParsedBloodworkMarker[];
  missingMarkers: string[];
}

export function parseBloodworkPdfTextWithMeta(text: string): BloodworkPdfParseResult {
  const rawText = normalizeText(text);
  console.log("RAW PDF TEXT:", rawText);

  const structuredMarkers = parseStructuredMarkers(rawText);
  console.log("STRUCTURED EXTRACTED MARKERS:", structuredMarkers);

  const clinipathMarkers = parseClinipathPdfText(rawText);
  console.log("CLINIPATH EXTRACTED MARKERS:", clinipathMarkers);

  const fallbackMarkers = extractClinipathFallbackMarkers(rawText);
  console.log("FALLBACK EXTRACTED MARKERS:", fallbackMarkers);

  const finalMarkers = mergeClinipathMarkers([
    clinipathMarkers,
    fallbackMarkers,
    structuredMarkers,
  ]);
  console.log("FINAL MARKERS TO INSERT:", finalMarkers);

  const missingMarkers = getMissingClinipathMarkerNames(finalMarkers);
  if (finalMarkers.length < EXPECTED_CLINIPATH_MARKER_COUNT) {
    console.warn("MISSING BLOODWORK MARKERS:", missingMarkers);
  }

  return {
    rawText,
    structuredMarkers,
    clinipathMarkers,
    fallbackMarkers,
    finalMarkers,
    missingMarkers,
  };
}

export function parseBloodworkPdfText(text: string): ParsedBloodworkMarker[] {
  return parseBloodworkPdfTextWithMeta(text).finalMarkers;
}

export async function parseBloodworkPdfBuffer(buffer: Buffer): Promise<ParsedBloodworkMarker[]> {
  const extraction = await extractPdfTextByPage(buffer);
  return parseBloodworkPdfText(extraction.combinedText);
}
