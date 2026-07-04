import { detectMarkerStatus, type ParsedMarkerStatus } from "@/lib/bloodwork/detect-marker-status";

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

const KNOWN_PANELS = [
  "androgens",
  "general chemistry",
  "liver function",
  "hormones",
  "lipids",
  "haematology",
  "hematology",
  "renal function",
  "kidney function",
  "thyroid",
  "iron studies",
  "vitamins",
  "electrolytes",
  "proteins",
  "inflammatory markers",
  "glucose metabolism",
];

const UNIT_PATTERN =
  /\b(x10\^?\d+\/L|x10[⁰¹²³⁴⁵⁶⁷⁸⁹]+\/L|mmol\/L|nmol\/L|pmol\/L|umol\/L|µmol\/L|mol\/L|g\/L|U\/L|IU\/L|mIU\/L|L\/L|%|fL|pg|ng\/mL|ng\/dL|mL\/min\/1\.73m2)\b/i;

const RANGE_BOTH = /(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*$/;
const RANGE_UPPER = /^<\s*(\d+\.?\d*)\s*$/;
const RANGE_LOWER = /^>\s*(\d+\.?\d*)\s*$/;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(d)))
    .replace(/×/g, "x");
}

function isPanelHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (/\d/.test(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  if (KNOWN_PANELS.some((p) => lower === p || lower.includes(p))) return true;

  if (/^[A-Z][A-Z0-9 /&()-]{2,}$/.test(trimmed)) return true;

  const words = trimmed.split(/\s+/);
  if (words.length <= 5 && /^[A-Za-z][A-Za-z /&()-]+$/.test(trimmed)) {
    return true;
  }

  return false;
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

  const upper = ref.match(RANGE_UPPER);
  if (upper) {
    return {
      reference_range: ref,
      range_low: null,
      range_high: Number(upper[1]),
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

function extractRangeFromEnd(line: string): {
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

function extractUnit(line: string): { remainder: string; unit: string } {
  const match = line.match(new RegExp(`^(.*?)\\s+(${UNIT_PATTERN.source})$`, "i"));
  if (match) {
    return { remainder: match[1].trim(), unit: match[2] };
  }
  return { remainder: line.trim(), unit: "" };
}

function extractFlag(line: string): { remainder: string; flag: "H" | "L" | null } {
  const match = line.match(/^(.+?)\s+([HL])\s*$/i);
  if (match) {
    return { remainder: match[1].trim(), flag: match[2].toUpperCase() as "H" | "L" };
  }
  return { remainder: line.trim(), flag: null };
}

function extractValue(line: string): {
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

export function parseMarkerRow(line: string, panel: string): ParsedBloodworkMarker | null {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 3) return null;
  if (isPanelHeading(cleaned)) return null;
  if (/^(page|report|patient|doctor|laboratory|collected|date|name|dob|ref)/i.test(cleaned)) {
    return null;
  }

  const { remainder: afterRange, ...range } = extractRangeFromEnd(cleaned);
  const { remainder: afterUnit, unit } = extractUnit(afterRange);
  const { remainder: afterFlag, flag } = extractFlag(afterUnit);
  const valueParts = extractValue(afterFlag);

  if (!valueParts.marker || valueParts.numeric_value == null) return null;
  if (valueParts.marker.length < 2) return null;

  const status = detectMarkerStatus({
    numeric_value: valueParts.numeric_value,
    comparator: valueParts.comparator,
    flag,
    range_low: range.range_low,
    range_high: range.range_high,
    reference_range: range.reference_range,
  });

  return {
    panel,
    marker: valueParts.marker,
    result: valueParts.result,
    numeric_value: valueParts.numeric_value,
    comparator: valueParts.comparator,
    flag,
    unit,
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

  let currentPanel = "General";
  const markers: ParsedBloodworkMarker[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (isPanelHeading(line)) {
      currentPanel = line.trim();
      continue;
    }

    const parsed = parseMarkerRow(line, currentPanel);
    if (!parsed) continue;

    const key = `${parsed.panel}::${parsed.marker}::${parsed.result}`;
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
