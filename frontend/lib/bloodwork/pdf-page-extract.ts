/**
 * Hybrid PDF text extraction: pdf.js text layer per page, with OCR fallback
 * for scanned or rasterized pages that expose little or no selectable text.
 */

import os from "node:os";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { withTimeout } from "@/lib/bloodwork/extraction-timeout";
import { getPdfJsServerModule } from "@/lib/bloodwork/pdfjs-server";

export const OCR_CHAR_THRESHOLD = 100;
const OCR_WORKER_TIMEOUT_MS = 20_000;
const OCR_PAGE_TIMEOUT_MS = 25_000;
const TESSERACT_CACHE_PATH = path.join(os.tmpdir(), "safepeds-tesseract-cache");

export type PdfTextExtractionMethod = "pdf.js-text-layer" | "hybrid-pdf.js-ocr";

export interface PdfPageText {
  pageNumber: number;
  text: string;
  charCount: number;
  isEmpty: boolean;
  pdfJsCharCount: number;
  ocrCharCount: number;
  ocrUsed: boolean;
}

export interface PdfTextExtractionResult {
  method: PdfTextExtractionMethod;
  pageCount: number;
  pages: PdfPageText[];
  combinedText: string;
  ocrUsed: boolean;
}

interface PdfTextItem {
  str?: string;
  transform: number[];
}

interface PdfTextContent {
  items: PdfTextItem[];
}

interface PdfRenderPage {
  getTextContent: (options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }) => Promise<PdfTextContent>;
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: ReturnType<ReturnType<typeof createCanvas>["getContext"]>;
    viewport: ReturnType<PdfRenderPage["getViewport"]>;
  }) => { promise: Promise<void> };
}

type OcrRecognizer = (imageBuffer: Buffer) => Promise<string>;

export function shouldRunOcrForPage(pdfJsCharCount: number): boolean {
  return pdfJsCharCount < OCR_CHAR_THRESHOLD;
}

export function mergePageTexts(pdfJsText: string, ocrText: string): string {
  const trimmedPdfJs = pdfJsText.trim();
  const trimmedOcr = ocrText.trim();

  if (!trimmedPdfJs) return ocrText;
  if (!trimmedOcr) return pdfJsText;

  return `${pdfJsText}\n${ocrText}`;
}

async function extractTextLayerFromPage(page: PdfRenderPage): Promise<string> {
  const textContent = await page.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  });

  let lastY: number | null = null;
  let text = "";

  for (const item of textContent.items) {
    if (item.str == null) continue;
    const y = item.transform[5];
    if (lastY === y || lastY == null) {
      text += item.str;
    } else {
      text += `\n${item.str}`;
    }
    lastY = y;
  }

  return text;
}

async function renderPageToImageBuffer(page: PdfRenderPage, scale = 2): Promise<Buffer> {
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toBuffer("image/png");
}

async function createOcrRecognizer(): Promise<{
  recognize: OcrRecognizer;
  terminate: () => Promise<unknown>;
}> {
  console.log("[pdf-ocr] Creating Tesseract worker...");
  const { createWorker } = await import("tesseract.js");

  const worker = await withTimeout(
    () =>
      createWorker("eng", 1, {
        cachePath: TESSERACT_CACHE_PATH,
        logger: (message) => {
          console.log(`[pdf-ocr] ${message.status}`, {
            progress: message.progress,
          });
        },
      }),
    OCR_WORKER_TIMEOUT_MS,
    "Tesseract worker startup"
  );
  console.log("[pdf-ocr] Tesseract worker ready");

  return {
    recognize: async (imageBuffer: Buffer) => {
      const { data } = await withTimeout(
        () => worker.recognize(imageBuffer),
        OCR_PAGE_TIMEOUT_MS,
        "Tesseract page OCR"
      );
      return data.text ?? "";
    },
    terminate: () => worker.terminate(),
  };
}

function buildPageText(
  pageNumber: number,
  pdfJsText: string,
  ocrText: string,
  ocrUsed: boolean
): PdfPageText {
  const mergedText = mergePageTexts(pdfJsText, ocrText);
  const pdfJsCharCount = pdfJsText.length;
  const ocrCharCount = ocrText.length;

  return {
    pageNumber,
    text: mergedText,
    charCount: mergedText.length,
    isEmpty: mergedText.trim().length < 10,
    pdfJsCharCount,
    ocrCharCount,
    ocrUsed,
  };
}

export function logHybridPageStats(page: PdfPageText): void {
  console.log(`Page ${page.pageNumber}:`);
  console.log(`pdf.js chars: ${page.pdfJsCharCount}`);
  console.log(`OCR chars: ${page.ocrUsed ? page.ocrCharCount : 0}`);
  console.log(`Final chars: ${page.charCount}`);
}

export async function extractPdfTextByPage(
  buffer: Buffer,
  options?: { ocrRecognizer?: OcrRecognizer }
): Promise<PdfTextExtractionResult> {
  try {
    console.log("[pdf-extract] Loading pdf.js...");
    const pdfjs = await getPdfJsServerModule();
    console.log("[pdf-extract] Opening PDF document...");
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    }).promise;
    console.log("[pdf-extract] PDF opened", { pageCount: pdf.numPages });

    const pages: PdfPageText[] = [];
    let documentOcrUsed = false;

    let ocr:
      | {
          recognize: OcrRecognizer;
          terminate: () => Promise<unknown>;
        }
      | null = null;

    if (options?.ocrRecognizer != null) {
      ocr = {
        recognize: options.ocrRecognizer,
        terminate: async () => {},
      };
    }

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        console.log(`[pdf-extract] Processing page ${pageNumber}/${pdf.numPages}...`);
        const page = (await pdf.getPage(pageNumber)) as unknown as PdfRenderPage;
        const pdfJsText = await extractTextLayerFromPage(page);
        const needsOcr = shouldRunOcrForPage(pdfJsText.length);
        console.log(`[pdf-extract] Page ${pageNumber} pdf.js chars=${pdfJsText.length}`, {
          needsOcr,
        });

        let ocrText = "";
        if (needsOcr) {
          documentOcrUsed = true;
          if (!ocr) {
            try {
              ocr = await createOcrRecognizer();
            } catch (ocrStartupError) {
              console.error("[pdf-ocr] Worker startup failed; continuing without OCR", ocrStartupError);
              ocr = {
                recognize: async () => "",
                terminate: async () => {},
              };
            }
          }

          try {
            console.log(`[pdf-ocr] Rendering page ${pageNumber} for OCR...`);
            const imageBuffer = await renderPageToImageBuffer(page);
            console.log(`[pdf-ocr] Running OCR on page ${pageNumber}...`);
            ocrText = await ocr.recognize(imageBuffer);
            console.log(`[pdf-ocr] Page ${pageNumber} OCR chars=${ocrText.length}`);
          } catch (ocrPageError) {
            console.error(`[pdf-ocr] Page ${pageNumber} OCR failed; using pdf.js text only`, ocrPageError);
            ocrText = "";
          }
        }

        const pageText = buildPageText(pageNumber, pdfJsText, ocrText, needsOcr && ocrText.length > 0);
        pages.push(pageText);
        logHybridPageStats(pageText);
      }
    } finally {
      if (ocr) {
        console.log("[pdf-ocr] Terminating Tesseract worker...");
        await ocr.terminate();
      }
      console.log("[pdf-extract] Destroying PDF document...");
      await pdf.destroy();
    }

    const combinedText = pages.map((page) => page.text).join("\n");
    console.log("[pdf-extract] PDF text extraction complete", {
      pageCount: pdf.numPages,
      ocrUsed: documentOcrUsed,
      combinedChars: combinedText.length,
    });

    return {
      method: documentOcrUsed ? "hybrid-pdf.js-ocr" : "pdf.js-text-layer",
      pageCount: pdf.numPages,
      pages,
      combinedText,
      ocrUsed: documentOcrUsed,
    };
  } catch (error) {
    console.error("PDF extraction failed:", error);
    throw error;
  }
}

export function logPdfPageText(extraction: PdfTextExtractionResult): void {
  console.log(`PDF pages detected: ${extraction.pageCount}`);
  console.log(`PDF text extraction method: ${extraction.method}`);
  console.log(`OCR used: ${extraction.ocrUsed ? "Yes" : "No"}`);

  for (const page of extraction.pages) {
    console.log(`===== PAGE ${page.pageNumber} =====`);
    console.log(page.text || "(empty — no extractable text on this page)");
    logHybridPageStats(page);
    console.log(`[page ${page.pageNumber}] empty=${page.isEmpty}`);
  }
}
