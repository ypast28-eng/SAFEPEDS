import { detectMarkerStatus } from "@/lib/bloodwork/detect-marker-status";
import {
  APPROVED_MARKERS_BY_CATEGORY,
  MARKER_NAME_ALIASES,
  type ApprovedBloodworkCategory,
  BLOODWORK_DISPLAY_CATEGORY_ORDER,
  toDisplayMarkerName,
} from "@/lib/bloodwork/approved-markers";
import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";

export const EXPECTED_CLINIPATH_MARKER_COUNT = 37;

const UNIT_PATTERN =
  /(?:x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|mL\/min\/1\.73m2|fL|pg|ng\/mL|ng\/dL|%)/i;

const REFERENCE_PATTERN =
  /(\d+\.?\d*\s*-\s*\d+\.?\d*|[<>]=?\s*\d+\.?\d*|>\s*\d+\.?\d*)/;

const RESULT_PATTERN =
  /([<>]=?\s*\d+\.?\d*(?:\s+[HL])?|\d+\.?\d*)/i;

interface WhitelistEntry {
  category: ApprovedBloodworkCategory;
  canonical: string;
  display: string;
  searchPattern: RegExp;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(d)))
    .replace(/×/g, "x");
}

function buildFlexibleNamePattern(name: string): string {
  return escapeRegex(name).replace(/\s+/g, "\\s+");
}

function buildWhitelistEntries(): WhitelistEntry[] {
  const entries: WhitelistEntry[] = [];

  for (const category of BLOODWORK_DISPLAY_CATEGORY_ORDER) {
    for (const canonical of APPROVED_MARKERS_BY_CATEGORY[category]) {
      const aliases = Object.entries(MARKER_NAME_ALIASES)
        .filter(([, target]) => target === canonical)
        .map(([alias]) => alias);
      const names = [...new Set([canonical, ...aliases])].sort((a, b) => b.length - a.length);
      const patternSource = names.map(buildFlexibleNamePattern).join("|");
      entries.push({
        category,
        canonical,
        display: toDisplayMarkerName(canonical),
        searchPattern: new RegExp(`(?:^|[\\s,;|])(${patternSource})(?=$|[\\s,;:|])`, "i"),
      });
    }
  }

  return entries.sort((a, b) => b.canonical.length - a.canonical.length);
}

const WHITELIST_ENTRIES = buildWhitelistEntries();

function parseReferenceRange(raw: string): {
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
} {
  const ref = raw.trim();
  const both = ref.match(/^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)$/);
  if (both) {
    return {
      reference_range: `${both[1]} - ${both[2]}`,
      range_low: Number(both[1]),
      range_high: Number(both[2]),
    };
  }

  const bound = ref.match(/^([<>]=?)\s*(\d+\.?\d*)$/);
  if (bound) {
    const comparator = bound[1];
    const value = Number(bound[2]);
    return {
      reference_range: `${comparator}${bound[2]}`,
      range_low: comparator.startsWith(">") ? value : null,
      range_high: comparator.startsWith("<") ? value : null,
    };
  }

  const lower = ref.match(/^>\s*(\d+\.?\d*)$/);
  if (lower) {
    return {
      reference_range: ref,
      range_low: Number(lower[1]),
      range_high: null,
    };
  }

  return { reference_range: ref, range_low: null, range_high: null };
}

function parseTailIntoMarker(
  category: ApprovedBloodworkCategory,
  canonical: string,
  tail: string
): ParsedBloodworkMarker | null {
  const compact = tail.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!compact) return null;

  const resultMatch = compact.match(new RegExp(`^${RESULT_PATTERN.source}`, "i"));
  if (!resultMatch?.[1]) return null;

  const result = resultMatch[1].replace(/\s+/g, " ").trim();
  let rest = compact.slice(resultMatch[0].length).trim();

  let unit: string | null = null;
  const unitMatch = rest.match(new RegExp(`^(${UNIT_PATTERN.source})(?=\\s|$)`, "i"));
  if (unitMatch) {
    unit = unitMatch[1];
    rest = rest.slice(unitMatch[0].length).trim();
  }

  let reference_range = "";
  let range_low: number | null = null;
  let range_high: number | null = null;

  const refMatch = rest.match(new RegExp(`^(${REFERENCE_PATTERN.source})(?=\\s|$|$)`, "i"));
  if (refMatch) {
    const parsedRef = parseReferenceRange(refMatch[1].replace(/\s+/g, " ").trim());
    reference_range = parsedRef.reference_range;
    range_low = parsedRef.range_low;
    range_high = parsedRef.range_high;
  }

  const comparatorMatch = result.match(/^([<>]=?)\s*(\d+\.?\d*)(?:\s+([HL]))?$/i);
  let numeric_value: number | null = null;
  let comparator: "<" | ">" | "<=" | ">=" | null = null;
  let flag: "H" | "L" | null = null;

  if (comparatorMatch) {
    comparator = comparatorMatch[1] as "<" | ">" | "<=" | ">=";
    numeric_value = Number(comparatorMatch[2]);
    flag = (comparatorMatch[3]?.toUpperCase() as "H" | "L" | undefined) ?? null;
  } else {
    numeric_value = Number(result);
  }

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
    marker: toDisplayMarkerName(canonical),
    result,
    numeric_value: Number.isFinite(numeric_value) ? numeric_value : null,
    comparator,
    flag,
    unit,
    reference_range,
    range_low,
    range_high,
    status,
  };
}

function findMarkerPositions(text: string): Array<{
  entry: WhitelistEntry;
  index: number;
  matchLength: number;
}> {
  const usedRanges: Array<{ start: number; end: number }> = [];
  const positions: Array<{
    entry: WhitelistEntry;
    index: number;
    matchLength: number;
  }> = [];

  for (const entry of WHITELIST_ENTRIES) {
    const match = text.match(entry.searchPattern);
    if (!match || match.index == null) continue;

    const start = match.index + (match[0].length - match[1].length);
    const end = start + match[1].length;
    const overlaps = usedRanges.some((range) => start < range.end && end > range.start);
    if (overlaps) continue;

    usedRanges.push({ start, end });
    positions.push({
      entry,
      index: start,
      matchLength: match[1].length,
    });
  }

  return positions.sort((a, b) => a.index - b.index);
}

const MAX_TAIL_CHARS = 60;

/** Hardcoded Clinipath fallback: search raw PDF text for each whitelist marker. */
export function extractClinipathFallbackMarkers(rawText: string): ParsedBloodworkMarker[] {
  const text = normalizeSearchText(rawText).replace(/\s+/g, " ");
  const positions = findMarkerPositions(text);
  const markers: ParsedBloodworkMarker[] = [];

  for (let i = 0; i < positions.length; i += 1) {
    const current = positions[i];
    const next = positions[i + 1];
    const tailStart = current.index + current.matchLength;
    const tailEnd = Math.min(
      next ? next.index : text.length,
      tailStart + MAX_TAIL_CHARS
    );
    const tail = text.slice(tailStart, tailEnd).trim();

    const parsed = parseTailIntoMarker(
      current.entry.category,
      current.entry.canonical,
      tail
    );
    if (parsed) markers.push(parsed);
  }

  return markers;
}

export function getExpectedClinipathMarkerNames(): string[] {
  return BLOODWORK_DISPLAY_CATEGORY_ORDER.flatMap((category) =>
    APPROVED_MARKERS_BY_CATEGORY[category].map((marker) => toDisplayMarkerName(marker))
  );
}

export function getMissingClinipathMarkerNames(
  markers: ParsedBloodworkMarker[]
): string[] {
  const found = new Set(markers.map((m) => `${m.panel}::${m.marker}`));
  const missing: string[] = [];

  for (const category of BLOODWORK_DISPLAY_CATEGORY_ORDER) {
    for (const canonical of APPROVED_MARKERS_BY_CATEGORY[category]) {
      const display = toDisplayMarkerName(canonical);
      const key = `${category}::${display}`;
      if (!found.has(key)) {
        missing.push(`${category} / ${display}`);
      }
    }
  }

  return missing;
}

export function mergeStructuredAndFallbackMarkers(
  structured: ParsedBloodworkMarker[],
  fallback: ParsedBloodworkMarker[]
): ParsedBloodworkMarker[] {
  const merged = new Map<string, ParsedBloodworkMarker>();

  for (const marker of [...structured, ...fallback]) {
    const key = `${marker.panel}::${marker.marker}`;
    if (!merged.has(key)) merged.set(key, marker);
  }

  return [...merged.values()];
}
