/**
 * Hybrid PDF text extraction: pdf.js text layer per page, with OCR fallback
 * for scanned or rasterized pages that expose little or no selectable text.
 */

import { createCanvas } from "@napi-rs/canvas";
import { getPdfJsServerModule } from "@/lib/bloodwork/pdfjs-server";

export const OCR_CHAR_THRESHOLD = 100;

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
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  return {
    recognize: async (imageBuffer: Buffer) => {
      const { data } = await worker.recognize(imageBuffer);
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
    const pdfjs = await getPdfJsServerModule();
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    }).promise;

    const pages: PdfPageText[] = [];
    let documentOcrUsed = false;

    const ocr =
      options?.ocrRecognizer != null
        ? {
            recognize: options.ocrRecognizer,
            terminate: async () => {},
          }
        : await createOcrRecognizer();

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = (await pdf.getPage(pageNumber)) as unknown as PdfRenderPage;
        const pdfJsText = await extractTextLayerFromPage(page);
        const needsOcr = shouldRunOcrForPage(pdfJsText.length);

        let ocrText = "";
        if (needsOcr) {
          documentOcrUsed = true;
          const imageBuffer = await renderPageToImageBuffer(page);
          ocrText = await ocr.recognize(imageBuffer);
        }

        const pageText = buildPageText(pageNumber, pdfJsText, ocrText, needsOcr);
        pages.push(pageText);
        logHybridPageStats(pageText);
      }
    } finally {
      await ocr.terminate();
    }

    const combinedText = pages.map((page) => page.text).join("\n");

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
