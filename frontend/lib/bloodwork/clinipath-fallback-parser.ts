import { detectMarkerStatus } from "@/lib/bloodwork/detect-marker-status";
import {
  APPROVED_MARKERS_BY_CATEGORY,
  MARKER_NAME_ALIASES,
  type ApprovedBloodworkCategory,
  BLOODWORK_DISPLAY_CATEGORY_ORDER,
  toDisplayMarkerName,
} from "@/lib/bloodwork/approved-markers";
import {
  EXPECTED_CLINIPATH_MARKER_COUNT,
  buildMarkerFromChunk,
  getMissingClinipathMarkerNames,
  mergeStructuredAndFallbackMarkers,
  normalizeClinipathText,
} from "@/lib/bloodwork/clinipath-parser";
import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";

export { EXPECTED_CLINIPATH_MARKER_COUNT, getMissingClinipathMarkerNames, mergeStructuredAndFallbackMarkers };

interface WhitelistEntry {
  category: ApprovedBloodworkCategory;
  canonical: string;
  display: string;
  searchPattern: RegExp;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        searchPattern: new RegExp(`(?:^|[\\s,;|])(${patternSource})(?=$|[\\s,;:|/])`, "i"),
      });
    }
  }

  return entries.sort((a, b) => b.canonical.length - a.canonical.length);
}

const WHITELIST_ENTRIES = buildWhitelistEntries();

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

const MAX_TAIL_CHARS = 80;

/** Raw-text fallback: search full PDF text for each whitelist marker. */
export function extractClinipathFallbackMarkers(rawText: string): ParsedBloodworkMarker[] {
  const text = normalizeClinipathText(rawText).replace(/\s+/g, " ");
  const positions = findMarkerPositions(text);
  const markers: ParsedBloodworkMarker[] = [];

  for (let i = 0; i < positions.length; i += 1) {
    const current = positions[i];
    const next = positions[i + 1];
    const tailStart = current.index + current.matchLength;
    const tailEnd = Math.min(next ? next.index : text.length, tailStart + MAX_TAIL_CHARS);
    const tail = text.slice(tailStart, tailEnd).trim();

    const parsed = buildMarkerFromChunk(current.entry.category, current.entry.canonical, tail);
    if (parsed) markers.push(parsed);
  }

  return markers;
}
