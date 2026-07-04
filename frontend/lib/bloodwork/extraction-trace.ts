/**
 * Step-by-step extraction trace for Clinipath PDF debugging.
 * Logs page-level text, parser stages, and per-marker failure reasons.
 */

import type { ApprovedBloodworkCategory } from "@/lib/bloodwork/approved-markers";
import { toDisplayMarkerName } from "@/lib/bloodwork/approved-markers";
import { extractClinipathFallbackMarkers } from "@/lib/bloodwork/clinipath-fallback-parser";
import {
  buildMarkerFromChunk,
  buildMarkerPattern,
  parseClinipathPdfText,
  splitClinipathCategoryBlocks,
} from "@/lib/bloodwork/clinipath-parser";
import type { ParsedBloodworkMarker } from "@/lib/bloodwork/parseBloodworkPdf";
import {
  parseBloodworkPdfTextWithMeta,
  parseStructuredMarkers,
  type BloodworkPdfParseResult,
} from "@/lib/bloodwork/parseBloodworkPdf";
import {
  extractPdfTextByPage,
  logPdfPageText,
  type PdfPageText,
  type PdfTextExtractionResult,
} from "@/lib/bloodwork/pdf-page-extract";

export type ExtractionParserStage =
  | "pdf.js-text-layer"
  | "structured-parser"
  | "clinipath-parser"
  | "fallback-parser"
  | "merged-markers"
  | "openai-extraction"
  | "ocr";

export interface TraceMarkerTarget {
  display: string;
  canonical: string;
  category: ApprovedBloodworkCategory;
}

/** Markers the user asked us to diagnose when missing. */
export const TRACE_MARKER_TARGETS: TraceMarkerTarget[] = [
  { display: "Testosterone", canonical: "Testosterone", category: "Androgens" },
  { display: "SHBG", canonical: "SHBG", category: "Androgens" },
  { display: "Free Testosterone", canonical: "Free Testosterone", category: "Androgens" },
  { display: "Urea", canonical: "Urea", category: "General Chemistry" },
  { display: "Creatinine", canonical: "Creatinine", category: "General Chemistry" },
  { display: "Sodium", canonical: "Sodium", category: "General Chemistry" },
  { display: "Potassium", canonical: "Potassium", category: "General Chemistry" },
  { display: "Chloride", canonical: "Chloride", category: "General Chemistry" },
  { display: "Bicarbonate", canonical: "Bicarbonate", category: "General Chemistry" },
  { display: "AST", canonical: "AST", category: "Liver Function" },
  { display: "ALT", canonical: "ALT", category: "Liver Function" },
  { display: "Gamma GT", canonical: "Gamma GT", category: "Liver Function" },
  { display: "Albumin", canonical: "Albumin", category: "Liver Function" },
  { display: "Haemoglobin", canonical: "Haemoglobin", category: "Haematology" },
  { display: "Red Cell Count", canonical: "Red cell count", category: "Haematology" },
  { display: "Platelets", canonical: "Platelets", category: "Haematology" },
];

export interface MarkerExtractionDiagnostic {
  marker: string;
  reasonNotExtracted: string;
  pageNumber: number | null;
  rawTextFound: string | null;
  regexMatched: boolean;
}

export interface PageMarkerSummary {
  pageNumber: number;
  charCount: number;
  isEmpty: boolean;
  markersFound: string[];
}

export interface ExtractionTraceResult {
  pdfExtraction: PdfTextExtractionResult;
  textExtractionMethod: ExtractionParserStage;
  aiExtractionUsed: boolean;
  ocrUsed: boolean;
  parseResult: BloodworkPdfParseResult;
  pageSummaries: PageMarkerSummary[];
  missingMarkerDiagnostics: MarkerExtractionDiagnostic[];
}

function summarizeMarkers(markers: ParsedBloodworkMarker[]): string[] {
  return markers.map((m) => `${m.panel} / ${m.marker} = ${m.result}`);
}

function findMarkerOnPages(
  pages: PdfPageText[],
  canonical: string
): { pageNumber: number | null; snippet: string | null; regexMatched: boolean } {
  const pattern = buildMarkerPattern(canonical);

  for (const page of pages) {
    const match = page.text.match(pattern);
    if (match?.index != null) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(page.text.length, match.index + match[0].length + 80);
      return {
        pageNumber: page.pageNumber,
        snippet: page.text.slice(start, end).replace(/\s+/g, " ").trim(),
        regexMatched: true,
      };
    }
  }

  return { pageNumber: null, snippet: null, regexMatched: false };
}

function diagnoseMarker(
  target: TraceMarkerTarget,
  pages: PdfPageText[],
  combinedText: string,
  finalMarkers: ParsedBloodworkMarker[],
  categoryBlocks: Map<ApprovedBloodworkCategory, string>
): MarkerExtractionDiagnostic | null {
  const display = toDisplayMarkerName(target.canonical);
  const found = finalMarkers.some(
    (m) => m.panel === target.category && m.marker === display
  );
  if (found) return null;

  const pageHit = findMarkerOnPages(pages, target.canonical);
  const categoryBlock = categoryBlocks.get(target.category);

  if (!pageHit.regexMatched) {
    const emptyPages = pages.filter((p) => p.isEmpty).map((p) => p.pageNumber);
    const reason =
      emptyPages.length > 0
        ? `Marker name not found in pdf.js text layer on any page. ${emptyPages.length} page(s) returned empty text (${emptyPages.join(", ")}), which usually means those pages are image/scanned with no selectable text — OCR was not run.`
        : "Marker name not found in pdf.js text layer on any page. Text extraction may have failed or the marker label differs from the whitelist.";

    return {
      marker: display,
      reasonNotExtracted: reason,
      pageNumber: null,
      rawTextFound: null,
      regexMatched: false,
    };
  }

  if (!categoryBlock) {
    return {
      marker: display,
      reasonNotExtracted: `Marker name matched on page ${pageHit.pageNumber}, but category block "${target.category}" was not detected in combined text. Clinipath section heading may be missing from OCR output or split across pages.`,
      pageNumber: pageHit.pageNumber,
      rawTextFound: pageHit.snippet,
      regexMatched: true,
    };
  }

  const flat = categoryBlock.replace(/\s+/g, " ");
  const pattern = buildMarkerPattern(target.canonical);
  const inline = flat.match(new RegExp(`${pattern.source}\\s*(.{0,100})`, "i"));
  const tail = inline?.[1]?.trim() ?? "";
  const parsed = tail ? buildMarkerFromChunk(target.category, target.canonical, tail) : null;

  if (!parsed) {
    return {
      marker: display,
      reasonNotExtracted: `Marker name matched on page ${pageHit.pageNumber} and category block exists, but value/unit/reference parsing failed for tail: "${tail.slice(0, 80) || "(empty tail)"}". Likely stacked-column or wrapped-row layout not aligned by the parser.`,
      pageNumber: pageHit.pageNumber,
      rawTextFound: pageHit.snippet,
      regexMatched: true,
    };
  }

  return {
    marker: display,
    reasonNotExtracted:
      "Marker row parsed from text but was dropped during merge/deduplication or validation — check SKIPPED MARKERS log.",
    pageNumber: pageHit.pageNumber,
    rawTextFound: pageHit.snippet,
    regexMatched: true,
  };
}

export async function runPdfExtractionTrace(buffer: Buffer): Promise<ExtractionTraceResult> {
  const pdfExtraction = await extractPdfTextByPage(buffer);
  const combinedText = pdfExtraction.combinedText;
  const parseResult = parseBloodworkPdfTextWithMeta(combinedText);
  const categoryBlocks = splitClinipathCategoryBlocks(combinedText);

  const pageSummaries: PageMarkerSummary[] = pdfExtraction.pages.map((page) => {
    const pageMarkers = parseClinipathPdfText(page.text);
    return {
      pageNumber: page.pageNumber,
      charCount: page.charCount,
      isEmpty: page.isEmpty,
      markersFound: summarizeMarkers(pageMarkers),
    };
  });

  const missingMarkerDiagnostics = TRACE_MARKER_TARGETS.map((target) =>
    diagnoseMarker(
      target,
      pdfExtraction.pages,
      combinedText,
      parseResult.finalMarkers,
      categoryBlocks
    )
  ).filter((d): d is MarkerExtractionDiagnostic => d != null);

  return {
    pdfExtraction,
    textExtractionMethod: "pdf.js-text-layer",
    aiExtractionUsed: false,
    ocrUsed: false,
    parseResult,
    pageSummaries,
    missingMarkerDiagnostics,
  };
}

export function logExtractionTrace(trace: ExtractionTraceResult): void {
  logPdfPageText(trace.pdfExtraction);

  console.log("Text extraction method:", trace.textExtractionMethod);
  console.log("OCR used:", trace.ocrUsed ? "Yes" : "No");
  console.log("AI extraction used:", trace.aiExtractionUsed ? "Yes" : "No");

  console.log("Structured parser:");
  console.log(summarizeMarkers(trace.parseResult.structuredMarkers));

  console.log("Clinipath parser:");
  console.log(summarizeMarkers(trace.parseResult.clinipathMarkers));

  console.log("Fallback parser:");
  console.log(summarizeMarkers(trace.parseResult.fallbackMarkers));

  console.log("Merged markers:");
  console.log(summarizeMarkers(trace.parseResult.finalMarkers));

  console.log("Per-page marker counts:");
  for (const summary of trace.pageSummaries) {
    console.log(
      `  Page ${summary.pageNumber}: chars=${summary.charCount} empty=${summary.isEmpty} markers=${summary.markersFound.length}`
    );
    if (summary.markersFound.length > 0) {
      console.log(`    ${summary.markersFound.join("; ")}`);
    }
  }

  if (trace.missingMarkerDiagnostics.length > 0) {
    console.log("Missing marker diagnostics:");
    for (const diagnostic of trace.missingMarkerDiagnostics) {
      console.log("Marker:", diagnostic.marker);
      console.log("Reason not extracted:", diagnostic.reasonNotExtracted);
      console.log("Page number:", diagnostic.pageNumber ?? "not found");
      console.log("Raw text found:", diagnostic.rawTextFound ?? "(none)");
      console.log("Regex matched?", diagnostic.regexMatched ? "Yes" : "No");
      console.log("---");
    }
  }
}

export async function traceAndParsePdf(buffer: Buffer): Promise<{
  trace: ExtractionTraceResult;
  parseResult: BloodworkPdfParseResult;
}> {
  const trace = await runPdfExtractionTrace(buffer);
  logExtractionTrace(trace);
  return { trace, parseResult: trace.parseResult };
}

/** Quick stage-only parse for unit tests without PDF buffer. */
export function traceParseFromText(text: string): ExtractionTraceResult {
  const parseResult = parseBloodworkPdfTextWithMeta(text);
  return {
    pdfExtraction: {
      method: "pdf.js-text-layer",
      pageCount: 1,
      pages: [{ pageNumber: 1, text, charCount: text.length, isEmpty: text.trim().length < 10 }],
      combinedText: text,
    },
    textExtractionMethod: "pdf.js-text-layer",
    aiExtractionUsed: false,
    ocrUsed: false,
    parseResult,
    pageSummaries: [
      {
        pageNumber: 1,
        charCount: text.length,
        isEmpty: text.trim().length < 10,
        markersFound: summarizeMarkers(parseResult.finalMarkers),
      },
    ],
    missingMarkerDiagnostics: TRACE_MARKER_TARGETS.map((target) =>
      diagnoseMarker(
        target,
        [{ pageNumber: 1, text, charCount: text.length, isEmpty: text.trim().length < 10 }],
        text,
        parseResult.finalMarkers,
        splitClinipathCategoryBlocks(text)
      )
    ).filter((d): d is MarkerExtractionDiagnostic => d != null),
  };
}

export { parseStructuredMarkers, extractClinipathFallbackMarkers };
