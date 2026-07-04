/**
 * Server-side pdf.js setup for Next.js API routes.
 *
 * In Node, pdf.js disables Web Workers and runs WorkerMessageHandler on the
 * main thread ("fake worker"). We preload that handler and resolve the worker
 * module path via Node resolution so it works in local dev and on Vercel.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

declare global {
  var pdfjsWorker: { WorkerMessageHandler: unknown } | undefined;
}

let pdfJsModulePromise: Promise<PdfJsModule> | null = null;

function resolvePdfJsWorkerModulePath(): string {
  const require = createRequire(path.resolve(process.cwd(), "package.json"));
  return require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
}

async function configurePdfJsForServer(pdfjs: PdfJsModule): Promise<PdfJsModule> {
  if (globalThis.pdfjsWorker?.WorkerMessageHandler == null) {
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    globalThis.pdfjsWorker = workerModule;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(resolvePdfJsWorkerModulePath()).href;

  return pdfjs;
}

export async function getPdfJsServerModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import("pdfjs-dist/legacy/build/pdf.mjs").then(configurePdfJsForServer);
  }
  return pdfJsModulePromise;
}

export function getPdfJsVersion(): string {
  const require = createRequire(path.resolve(process.cwd(), "package.json"));
  const pkg = require("pdfjs-dist/package.json") as { version?: string };
  return pkg.version ?? "unknown";
}
