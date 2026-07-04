import { describe, expect, it } from "vitest";
import {
  logExtractionTrace,
  traceParseFromText,
  TRACE_MARKER_TARGETS,
} from "@/lib/bloodwork/extraction-trace";

const PARTIAL_CLINIPATH = `===== PAGE 1 equivalent =====
Lipids
Cholesterol 4.1 mmol/L <5.0
HDL Cholesterol 1.4 mmol/L >1.0
General Chemistry
eGFR >90 mL/min/1.73m2 >59`;

describe("extraction trace", () => {
  it("reports diagnostics for markers missing from partial text", () => {
    const trace = traceParseFromText(PARTIAL_CLINIPATH);

    expect(trace.parseResult.finalMarkers.length).toBeLessThan(37);
    expect(trace.missingMarkerDiagnostics.some((d) => d.marker === "Testosterone")).toBe(true);
    expect(trace.missingMarkerDiagnostics.find((d) => d.marker === "Testosterone")).toMatchObject({
      regexMatched: false,
    });
    expect(TRACE_MARKER_TARGETS.length).toBe(16);
  });

  it("logs per-page and stage output without throwing", () => {
    const trace = traceParseFromText(PARTIAL_CLINIPATH);
    expect(() => logExtractionTrace(trace)).not.toThrow();
  });
});
