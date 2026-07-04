/**
 * Extract text from each PDF page separately using pdf-parse (pdf.js text layer).
 */

export type PdfTextExtractionMethod = "pdf.js-text-layer";

export interface PdfPageText {
  pageNumber: number;
  text: string;
  charCount: number;
  isEmpty: boolean;
}

export interface PdfTextExtractionResult {
  method: PdfTextExtractionMethod;
  pageCount: number;
  pages: PdfPageText[];
  combinedText: string;
}

interface PdfPageData {
  getTextContent: (options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }) => Promise<{
    items: Array<{ str: string; transform: number[] }>;
  }>;
}

async function renderPageText(pageData: PdfPageData): Promise<string> {
  const textContent = await pageData.getTextContent({
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

export async function extractPdfTextByPage(buffer: Buffer): Promise<PdfTextExtractionResult> {
  const pages: PdfPageText[] = [];
  let pageNumber = 0;

  const pdfParse = (await import("pdf-parse")).default;

  const result = await pdfParse(buffer, {
    pagerender: async (pageData: PdfPageData) => {
      pageNumber += 1;
      const text = await renderPageText(pageData);
      pages.push({
        pageNumber,
        text,
        charCount: text.length,
        isEmpty: text.trim().length < 10,
      });
      return text;
    },
  });

  const combinedText = pages.map((page) => page.text).join("\n");

  return {
    method: "pdf.js-text-layer",
    pageCount: result.numpages ?? pages.length,
    pages,
    combinedText: combinedText || result.text || "",
  };
}

export function logPdfPageText(extraction: PdfTextExtractionResult): void {
  console.log(`PDF pages detected: ${extraction.pageCount}`);
  console.log(`PDF text extraction method: ${extraction.method}`);

  for (const page of extraction.pages) {
    console.log(`===== PAGE ${page.pageNumber} =====`);
    console.log(page.text || "(empty — no pdf.js text layer on this page)");
    console.log(
      `[page ${page.pageNumber}] chars=${page.charCount} empty=${page.isEmpty}`
    );
  }
}
