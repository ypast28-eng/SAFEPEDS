import { describe, expect, it } from "vitest";
import { runExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";
import {
  adaptRawExtractedMarker,
  prepareMarkersForInsert,
  toValidatedExtractedMarker,
} from "@/lib/bloodwork/validate-markers";
import type { RawExtractedMarker } from "@/lib/bloodwork/match-markers";

describe("prepareMarkersForInsert", () => {
  it("skips markers with empty names", () => {
    const { valid, skipped } = prepareMarkersForInsert([
      { marker_name: "   ", result_value: 5, unit: "U/L", category: "Liver", reference_low: null, reference_high: null },
      { marker_name: "ALT", result_value: 36, unit: "U/L", category: "Liver", reference_low: 5, reference_high: 40 },
    ]);

    expect(valid).toHaveLength(1);
    expect(valid[0]?.marker_name).toBe("ALT");
    expect(skipped).toHaveLength(1);
  });

  it("deduplicates markers by normalized name", () => {
    const { valid, skipped } = prepareMarkersForInsert([
      { marker_name: "ALT", result_value: 36, unit: "U/L", category: "Liver", reference_low: 5, reference_high: 40 },
      { marker_name: " alt ", result_value: 40, unit: "U/L", category: "Liver", reference_low: 5, reference_high: 40 },
    ]);

    expect(valid).toHaveLength(1);
    expect(skipped.some((s) => s.reason === "Duplicate marker")).toBe(true);
  });

  it("adapts alternate parser field names", () => {
    const adapted = adaptRawExtractedMarker({
      marker: "Haemoglobin",
      numeric_value: 145,
      units: "g/L",
      reference_range: "130 - 180",
      panel: "Haematology",
    });

    expect(adapted).toMatchObject({
      marker_name: "Haemoglobin",
      result_value: 145,
      unit: "g/L",
      panel: "Haematology",
    });
  });

  it("returns validated marker shape", () => {
    const validated = toValidatedExtractedMarker({
      marker_name: "Creatinine",
      category: "Kidney",
      result_value: 90,
      unit: "umol/L",
      reference_low: 60,
      reference_high: 110,
    });

    expect(validated).toEqual({
      marker_name: "Creatinine",
      result_value: 90,
      unit: "umol/L",
      reference_range: "60 – 110 umol/L",
      status: "Normal",
    });
  });
});

describe("runExtractionPipeline", () => {
  it("maps common pathology markers without null marker names", () => {
    const raw: RawExtractedMarker[] = [
      { name: "Haemoglobin", value: 145, unit: "g/L", reference_low: 130, reference_high: 180 },
      { name: "Haematocrit", value: 0.48, unit: "", reference_low: 0.4, reference_high: 0.54 },
      { name: "RBC", value: 4.8, unit: "x10^12/L", reference_low: 4.5, reference_high: 5.5 },
      { name: "WBC", value: 6.2, unit: "x10^9/L", reference_low: 4.0, reference_high: 11.0 },
      { name: "Platelets", value: 252, unit: "x10^9/L", reference_low: 150, reference_high: 400 },
      { name: "ALT", value: 36, unit: "U/L", reference_low: 5, reference_high: 40 },
      { name: "AST", value: 34, unit: "U/L", reference_low: 10, reference_high: 40 },
      { name: "GGT", value: 28, unit: "U/L", reference_low: 5, reference_high: 50 },
      { name: "Creatinine", value: 90, unit: "umol/L", reference_low: 60, reference_high: 110 },
      { name: "eGFR", value: 90, unit: "mL/min/1.73m2", reference_low: 59, reference_high: null },
      { name: "Testosterone", value: 28.5, unit: "nmol/L", reference_low: 9.5, reference_high: 35 },
      { name: "SHBG", value: 25, unit: "nmol/L", reference_low: 10, reference_high: 70 },
      { name: "Free Testosterone", value: 710, unit: "pmol/L", reference_low: 260, reference_high: 750 },
      { name: "Estradiol", value: 85, unit: "pmol/L", reference_low: null, reference_high: 160 },
      { name: "Prolactin", value: 220, unit: "mIU/L", reference_low: 45, reference_high: 375 },
      { name: "LH", value: 4, unit: "U/L", reference_low: 1, reference_high: 8 },
      { name: "FSH", value: 3, unit: "U/L", reference_low: 1, reference_high: 8 },
      { name: "Albumin", value: 42, unit: "g/L", reference_low: 35, reference_high: 50 },
      { name: "Bilirubin", value: 12, unit: "umol/L", reference_low: 3, reference_high: 20 },
      { name: "Cholesterol", value: 4.1, unit: "mmol/L", reference_low: null, reference_high: 5 },
      { name: "HDL", value: 1.4, unit: "mmol/L", reference_low: 1.0, reference_high: null },
      { name: "LDL", value: 2.2, unit: "mmol/L", reference_low: null, reference_high: 3.0 },
      { name: "Triglycerides", value: 0.9, unit: "mmol/L", reference_low: null, reference_high: 2.0 },
    ];

    const pipeline = runExtractionPipeline(raw, []);
    expect(pipeline.validMarkers.length).toBe(raw.length);
    expect(pipeline.validMarkers.every((m) => m.marker_name.trim().length > 0)).toBe(true);
    expect(pipeline.validMarkers.every((m) => Number.isFinite(m.result_value))).toBe(true);
  });
});
