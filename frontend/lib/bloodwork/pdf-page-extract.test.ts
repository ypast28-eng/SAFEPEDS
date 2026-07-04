import { describe, expect, it } from "vitest";
import {
  mergePageTexts,
  OCR_CHAR_THRESHOLD,
  shouldRunOcrForPage,
} from "@/lib/bloodwork/pdf-page-extract";

describe("pdf-page-extract helpers", () => {
  it("runs OCR when pdf.js returns fewer than 100 characters", () => {
    expect(OCR_CHAR_THRESHOLD).toBe(100);
    expect(shouldRunOcrForPage(0)).toBe(true);
    expect(shouldRunOcrForPage(99)).toBe(true);
    expect(shouldRunOcrForPage(100)).toBe(false);
    expect(shouldRunOcrForPage(500)).toBe(false);
  });

  it("merges pdf.js and OCR text without dropping either source", () => {
    expect(mergePageTexts("", "OCR only")).toBe("OCR only");
    expect(mergePageTexts("pdf.js only", "")).toBe("pdf.js only");
    expect(mergePageTexts("Layer", "OCR")).toBe("Layer\nOCR");
  });
});
