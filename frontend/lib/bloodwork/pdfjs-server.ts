/**
 * Server-side pdf.js setup for Next.js API routes.
 *
 * In Node, pdf.js disables Web Workers and runs WorkerMessageHandler on the
 * main thread. Preload that handler directly — no workerSrc or browser worker
 * configuration in server/API code.
 */

import { createRequire } from "node:module";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

declare global {
  var pdfjsWorker: { WorkerMessageHandler: unknown } | undefined;
}

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;

async function configurePdfJsForServer(pdfjs: PdfJsModule): Promise<PdfJsModule> {
  if (globalThis.pdfjsWorker?.WorkerMessageHandler == null) {
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    globalThis.pdfjsWorker = workerModule;
  }

  return pdfjs;
}

export async function getPdfJsServerModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs").then(configurePdfJsForServer);
  }
  return pdfJsModulePromise;
}

export function getPdfJsVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("pdfjs-dist/package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}
