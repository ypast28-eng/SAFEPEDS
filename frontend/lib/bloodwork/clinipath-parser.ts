/**
 * Provider-specific Clinipath PDF parser.
 * Handles inline rows, wrapped multi-line rows, and stacked column OCR layouts.
 */

import { detectMarkerStatus } from "@/lib/bloodwork/detect-marker-status";
import {
  APPROVED_MARKERS_BY_CATEGORY,
  CATEGORY_HEADING_ALIASES,
  MARKER_NAME_ALIASES,
  type ApprovedBloodworkCategory,
  BLOODWORK_DISPLAY_CATEGORY_ORDER,
  toDisplayMarkerName,
} from "@/lib/bloodwork/approved-markers";
import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";

export const EXPECTED_CLINIPATH_MARKER_COUNT = 37;

const UNIT_PATTERN =
  /(?:x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|mL\/min\/1\.73m[²2]|fL|pg|ng\/mL|ng\/dL|%)/i;

const REFERENCE_PATTERN =
  /(\d+\.?\d*\s*-\s*\d+\.?\d*|[<>]=?\s*\d+\.?\d*|>\s*\d+\.?\d*)/;

const RESULT_PATTERN = /([<>]=?\s*\d+\.?\d*|\d+\.?\d*)/i;

const CATEGORY_BLOCK_PATTERNS: Array<{
  category: ApprovedBloodworkCategory;
  pattern: RegExp;
}> = [
  { category: "Androgens", pattern: /\bAndrogens\b/i },
  { category: "Hormones", pattern: /\bHormones\b/i },
  { category: "General Chemistry", pattern: /\b(?:General Chemistry|Renal Function|Kidney Function|Electrolytes)\b/i },
  { category: "Liver Function", pattern: /\b(?:Liver Function|Liver Profile)\b/i },
  { category: "Lipids", pattern: /\b(?:Lipids|Lipid Studies)\b/i },
  { category: "Haematology", pattern: /\b(?:Haematology|Hematology|Full Blood Count|FBC)\b/i },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMarkerPattern(name: string): RegExp {
  const aliases = Object.entries(MARKER_NAME_ALIASES)
    .filter(([, target]) => target === name)
    .map(([alias]) => alias);
  const names = [...new Set([name, ...aliases])]
    .sort((a, b) => b.length - a.length)
    .map((n) => escapeRegex(n).replace(/\s+/g, "\\s+"));
  return new RegExp(`\\b(?:${names.join("|")})\\b`, "i");
}

export function normalizeClinipathText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(d)))
    .replace(/×/g, "x")
    .replace(/m\u00b2/g, "m2")
    .replace(/m²/g, "m2")
    .replace(/µ/g, "u");
}

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

  return { reference_range: ref, range_low: null, range_high: null };
}

function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  if (/mL\/min\/1\.73m/i.test(unit)) return "mL/min/1.73m²";
  return unit.trim() || null;
}

function buildMarker(
  category: ApprovedBloodworkCategory,
  canonical: string,
  result: string,
  unit: string | null,
  reference_range: string,
  range_low: number | null,
  range_high: number | null,
  flag: "H" | "L" | null = null
): ParsedBloodworkMarker {
  const comparatorMatch = result.match(/^([<>]=?)\s*(\d+\.?\d*)$/);
  let numeric_value: number | null = null;
  let comparator: "<" | ">" | "<=" | ">=" | null = null;

  if (comparatorMatch) {
    comparator = comparatorMatch[1] as "<" | ">" | "<=" | ">=";
    numeric_value = Number(comparatorMatch[2]);
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
    unit: normalizeUnit(unit),
    reference_range,
    range_low,
    range_high,
    status,
  };
}

/** Parse result, optional unit, optional reference from a text chunk. */
export function parseClinipathValueChunk(chunk: string): {
  result: string;
  unit: string | null;
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
  flag: "H" | "L" | null;
} | null {
  const compact = chunk.replace(/\s+/g, " ").trim();
  if (!compact) return null;

  const resultMatch = compact.match(new RegExp(`^${RESULT_PATTERN.source}`, "i"));
  if (!resultMatch?.[1]) return null;

  const result = resultMatch[1].replace(/\s+/g, " ").trim();
  let rest = compact.slice(resultMatch[0].length).trim();
  let flag: "H" | "L" | null = null;

  const flagMatch = rest.match(/^([HL])(?=\s|$)/i);
  if (flagMatch && !rest.match(/^([HL])\s*\/\s*/i)) {
    flag = flagMatch[1].toUpperCase() as "H" | "L";
    rest = rest.slice(flagMatch[0].length).trim();
  }

  let unit: string | null = null;
  const unitMatch = rest.match(new RegExp(`^(${UNIT_PATTERN.source})(?=\\s|$)`, "i"));
  if (unitMatch) {
    unit = normalizeUnit(unitMatch[1]);
    rest = rest.slice(unitMatch[0].length).trim();
  }

  let reference_range = "";
  let range_low: number | null = null;
  let range_high: number | null = null;

  const refMatch = rest.match(new RegExp(`^(${REFERENCE_PATTERN.source})`, "i"));
  if (refMatch) {
    const parsed = parseReferenceRange(refMatch[1].replace(/\s+/g, " ").trim());
    reference_range = parsed.reference_range;
    range_low = parsed.range_low;
    range_high = parsed.range_high;
  }

  return { result, unit, reference_range, range_low, range_high, flag };
}

export function buildMarkerFromChunk(
  category: ApprovedBloodworkCategory,
  canonical: string,
  chunk: string
): ParsedBloodworkMarker | null {
  const parsed = parseClinipathValueChunk(chunk);
  if (!parsed) return null;
  return buildMarker(
    category,
    canonical,
    parsed.result,
    parsed.unit,
    parsed.reference_range,
    parsed.range_low,
    parsed.range_high,
    parsed.flag
  );
}

function markerNamesForCategory(category: ApprovedBloodworkCategory): string[] {
  return [...APPROVED_MARKERS_BY_CATEGORY[category]].sort((a, b) => b.length - a.length);
}

function isResultLine(line: string): boolean {
  return RESULT_PATTERN.test(line.trim());
}

function isUnitLine(line: string): boolean {
  const trimmed = line.trim();
  return new RegExp(`^${UNIT_PATTERN.source}$`, "i").test(trimmed);
}

function isReferenceLine(line: string): boolean {
  const trimmed = line.trim();
  if (isUnitLine(trimmed)) return false;
  if (/^\d+\.?\d*$/.test(trimmed)) return false;
  return new RegExp(`^${REFERENCE_PATTERN.source}$`, "i").test(trimmed);
}

export function splitClinipathCategoryBlocks(text: string): Map<ApprovedBloodworkCategory, string> {
  const normalized = normalizeClinipathText(text);
  const blocks = new Map<ApprovedBloodworkCategory, string>();

  const hits: Array<{ category: ApprovedBloodworkCategory; index: number; length: number }> = [];
  for (const { category, pattern } of CATEGORY_BLOCK_PATTERNS) {
    const match = normalized.match(pattern);
    if (match?.index != null) {
      hits.push({ category, index: match.index, length: match[0].length });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  for (let i = 0; i < hits.length; i += 1) {
    const current = hits[i];
    const next = hits[i + 1];
    const start = current.index + current.length;
    const end = next ? next.index : normalized.length;
    const existing = blocks.get(current.category);
    const slice = normalized.slice(start, end).trim();
    blocks.set(current.category, existing ? `${existing}\n${slice}` : slice);
  }

  return blocks;
}

function findMarkerLineIndex(lines: string[], canonical: string): number {
  const pattern = buildMarkerPattern(canonical);
  return lines.findIndex((line) => pattern.test(line.trim()));
}

function nextMarkerLineIndex(
  lines: string[],
  fromIndex: number,
  markers: string[]
): number {
  for (let i = fromIndex + 1; i < lines.length; i += 1) {
    for (const marker of markers) {
      const pattern = buildMarkerPattern(marker);
      const trimmed = lines[i]?.trim() ?? "";
      if (pattern.test(trimmed) && trimmed.match(pattern)?.index === 0) {
        return i;
      }
    }
  }
  return lines.length;
}

/** Inline + multi-line extraction within a category block. */
function extractInlineAndMultilineMarkers(
  category: ApprovedBloodworkCategory,
  blockText: string
): ParsedBloodworkMarker[] {
  const markers: ParsedBloodworkMarker[] = [];
  const canonicalMarkers = markerNamesForCategory(category);
  const lines = blockText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const canonical of canonicalMarkers) {
    const pattern = buildMarkerPattern(canonical);
    const lineIndex = findMarkerLineIndex(lines, canonical);

    if (lineIndex >= 0) {
      const endIndex = nextMarkerLineIndex(lines, lineIndex, canonicalMarkers);
      const windowLines = lines.slice(lineIndex, Math.min(endIndex, lineIndex + 5));
      const joined = windowLines.join(" ");
      const markerMatch = joined.match(pattern);
      if (markerMatch?.index != null) {
        const tail = joined.slice(markerMatch.index + markerMatch[0].length).trim();
        const parsed = parseClinipathValueChunk(tail);
        if (parsed) {
          markers.push(
            buildMarker(
              category,
              canonical,
              parsed.result,
              parsed.unit,
              parsed.reference_range,
              parsed.range_low,
              parsed.range_high,
              parsed.flag
            )
          );
          continue;
        }
      }
    }

    const flat = blockText.replace(/\s+/g, " ");
    const flatMatch = flat.match(new RegExp(`${pattern.source}\\s*(.{0,100})`, "i"));
    if (flatMatch?.[1]) {
      const parsed = parseClinipathValueChunk(flatMatch[1]);
      if (parsed) {
        markers.push(
          buildMarker(
            category,
            canonical,
            parsed.result,
            parsed.unit,
            parsed.reference_range,
            parsed.range_low,
            parsed.range_high,
            parsed.flag
          )
        );
      }
    }
  }

  return markers;
}

/** Stacked column layout: marker names listed, then results, units, references. */
function extractStackedColumnMarkers(
  category: ApprovedBloodworkCategory,
  blockText: string
): ParsedBloodworkMarker[] {
  const lines = blockText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const canonicalMarkers = markerNamesForCategory(category);
  const markerHits: Array<{ canonical: string; lineIndex: number }> = [];

  for (let i = 0; i < lines.length; i += 1) {
    for (const canonical of canonicalMarkers) {
      const pattern = buildMarkerPattern(canonical);
      const trimmed = lines[i] ?? "";
      if (pattern.test(trimmed) && trimmed.match(pattern)?.[0] === trimmed) {
        if (!markerHits.some((hit) => hit.canonical === canonical)) {
          markerHits.push({ canonical, lineIndex: i });
        }
        break;
      }
    }
  }

  if (markerHits.length < 2) return [];

  const dataStart = markerHits[markerHits.length - 1].lineIndex + 1;
  const dataLines = lines.slice(dataStart);
  const n = markerHits.length;

  const resultLines: string[] = [];
  const unitLines: string[] = [];
  const refLines: string[] = [];

  for (const line of dataLines) {
    if (resultLines.length < n && isResultLine(line) && !isUnitLine(line)) {
      resultLines.push(line);
      continue;
    }
    if (resultLines.length >= n && unitLines.length < n && isUnitLine(line)) {
      unitLines.push(line);
      continue;
    }
    if (unitLines.length >= n && refLines.length < n && isReferenceLine(line)) {
      refLines.push(line);
    }
  }

  if (resultLines.length < n) return [];

  const markers: ParsedBloodworkMarker[] = [];
  for (let i = 0; i < markerHits.length; i += 1) {
    const hit = markerHits[i];
    const resultLine = resultLines[i];
    if (!resultLine) continue;

    const parsed = parseClinipathValueChunk(resultLine);
    if (!parsed) continue;

    const unit = unitLines[i] ?? parsed.unit;
    const refLine = refLines[i];
    let reference_range = parsed.reference_range;
    let range_low = parsed.range_low;
    let range_high = parsed.range_high;

    if (refLine) {
      const refParsed = parseReferenceRange(refLine.trim());
      reference_range = refParsed.reference_range;
      range_low = refParsed.range_low;
      range_high = refParsed.range_high;
    }

    markers.push(
      buildMarker(category, hit.canonical, parsed.result, unit, reference_range, range_low, range_high, parsed.flag)
    );
  }

  return markers;
}

function markerCompleteness(marker: ParsedBloodworkMarker): number {
  let score = marker.result ? 1 : 0;
  if (marker.unit) score += 2;
  if (marker.reference_range) score += 2;
  return score;
}

function dedupeBest(markers: ParsedBloodworkMarker[]): ParsedBloodworkMarker[] {
  const best = new Map<string, ParsedBloodworkMarker>();
  for (const marker of markers) {
    const key = `${marker.panel}::${marker.marker}`;
    const existing = best.get(key);
    if (!existing || markerCompleteness(marker) > markerCompleteness(existing)) {
      best.set(key, marker);
    }
  }
  return [...best.values()];
}

/** Primary Clinipath provider parser. */
export function parseClinipathPdfText(rawText: string): ParsedBloodworkMarker[] {
  const blocks = splitClinipathCategoryBlocks(rawText);
  const all: ParsedBloodworkMarker[] = [];

  for (const category of BLOODWORK_DISPLAY_CATEGORY_ORDER) {
    const blockText = blocks.get(category);
    if (!blockText) continue;

    const inline = extractInlineAndMultilineMarkers(category, blockText);
    const stacked = extractStackedColumnMarkers(category, blockText);
    all.push(...inline, ...stacked);
  }

  return dedupeBest(all);
}

export function getMissingClinipathMarkerNames(markers: ParsedBloodworkMarker[]): string[] {
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

export function mergeClinipathMarkers(
  sources: ParsedBloodworkMarker[][]
): ParsedBloodworkMarker[] {
  return dedupeBest(sources.flat());
}

export function mergeStructuredAndFallbackMarkers(
  structured: ParsedBloodworkMarker[],
  fallback: ParsedBloodworkMarker[]
): ParsedBloodworkMarker[] {
  return mergeClinipathMarkers([structured, fallback]);
}

export function isClinipathReport(text: string): boolean {
  const normalized = normalizeClinipathText(text).toLowerCase();
  if (normalized.includes("clinipath")) return true;
  return CATEGORY_BLOCK_PATTERNS.some(({ pattern }) => pattern.test(normalized));
}

export { CATEGORY_HEADING_ALIASES };
