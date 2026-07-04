import { describe, expect, it } from "vitest";
import { getPdfJsServerModule, getPdfJsVersion } from "@/lib/bloodwork/pdfjs-server";
import fs from "node:fs";

describe("pdfjs-server", () => {
  it("loads pdf.js with a resolvable legacy worker path", async () => {
    expect(getPdfJsVersion()).toMatch(/^\d+\.\d+\.\d+/);

    const pdfjs = await getPdfJsServerModule();
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toContain("pdfjs-dist/legacy/build/pdf.worker.mjs");
    expect(globalThis.pdfjsWorker?.WorkerMessageHandler).toBeDefined();
  });

  it("opens a PDF without worker setup errors", async () => {
    if (!fs.existsSync("/tmp/scanned-test.pdf")) {
      return;
    }

    const pdfjs = await getPdfJsServerModule();
    const buffer = fs.readFileSync("/tmp/scanned-test.pdf");
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
    }).promise;

    expect(pdf.numPages).toBeGreaterThan(0);
    await pdf.destroy();
  });
});
