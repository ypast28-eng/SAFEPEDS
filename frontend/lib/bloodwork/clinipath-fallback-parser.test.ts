import { describe, expect, it } from "vitest";
import {
  EXPECTED_CLINIPATH_MARKER_COUNT,
  extractClinipathFallbackMarkers,
  getMissingClinipathMarkerNames,
  mergeStructuredAndFallbackMarkers,
} from "@/lib/bloodwork/clinipath-fallback-parser";
import { parseBloodworkPdfTextWithMeta } from "@/lib/bloodwork/parseBloodworkPdf";

const MESSY_CLINIPATH_BLOB = `Patient: John Smith Collection 01/01/2026
Androgens Testosterone 28.5 nmol/L 9.5-35.0 SHBG 25 nmol/L 10-70 Free Testosterone 710.0 pmol/L 260-750
Hormones FSH <1 L U/L 1-8 LH <1 L U/L 1.0-8.0 Oestradiol <85 pmol/L <160
General Chemistry Urea 7.3 mmol/L 3.0-7.5 Creatinine 90 umol/L 60-110 eGFR >90 >59 Sodium 140 mmol/L 135-145 Potassium 4.2 mmol/L 3.5-5.2 Chloride 102 mmol/L 95-110 Bicarbonate 26 mmol/L 22-32
Liver Function AST 34 U/L 10-40 ALT 36 U/L 5-40 Alk Phos 72 U/L 30-120 Gamma GT 28 U/L 5-50 Total Bilirubin 12 umol/L 3-20 Total Protein 72 g/L 60-80 Albumin 42 g/L 35-50 Globulin 30 g/L 20-40
Lipids Random Cholesterol 4.1 mmol/L <5.0 Triglyceride 0.9 mmol/L <2.0 HDL Cholesterol 1.4 mmol/L >1.0 Chol/HDL Ratio 2.9 <5.0 LDL Cholesterol 2.2 mmol/L <3.0 Non HDL Cholesterol 2.7 mmol/L <4.0
Haematology Haemoglobin 145 g/L 130-180 Red cell count 4.8 x10^12/L 4.5-5.5 Haematocrit 0.48 0.40-0.54 MCV 88 fL 80-100 MCH 30 pg 27-33 MCHC 330 g/L 320-360 RDW 13 % 11-15 White cell count 6.2 x10^9/L 4.0-11.0 Neutrophils 3.5 x10^9/L 2.0-7.5 Lymphocytes 2.1 x10^9/L 1.0-4.0 Monocytes 0.5 x10^9/L 0.2-1.0 Eosinophils 0.1 x10^9/L 0.0-0.5 Basophils <0.1 x10^9/L 0.0-0.2 Platelets 252 x10^9/L 150-400`;

describe("extractClinipathFallbackMarkers", () => {
  it("extracts markers from messy single-line Clinipath OCR text", () => {
    const markers = extractClinipathFallbackMarkers(MESSY_CLINIPATH_BLOB);

    expect(markers.length).toBeGreaterThanOrEqual(EXPECTED_CLINIPATH_MARKER_COUNT);
    expect(markers.find((m) => m.marker === "Testosterone")).toMatchObject({
      panel: "Androgens",
      result: "28.5",
      unit: "nmol/L",
    });
    expect(markers.find((m) => m.marker === "FSH")).toMatchObject({
      panel: "Hormones",
      result: "<1",
      unit: "U/L",
    });
    expect(markers.find((m) => m.marker === "Total Cholesterol")).toMatchObject({
      panel: "Lipids",
      result: "4.1",
    });
    expect(markers.find((m) => m.marker === "Chol/HDL Ratio")).toMatchObject({
      result: "2.9",
      unit: null,
    });
    expect(markers.find((m) => m.marker === "Non HDL Cholesterol")).toBeDefined();
  });

  it("merges structured and fallback markers without duplicate category+marker keys", () => {
    const merged = mergeStructuredAndFallbackMarkers(
      [
        {
          panel: "Lipids",
          marker: "Total Cholesterol",
          result: "4.1",
          numeric_value: 4.1,
          comparator: null,
          flag: null,
          unit: "mmol/L",
          reference_range: "<5.0",
          range_low: null,
          range_high: 5,
          status: "normal",
        },
      ],
      [
        {
          panel: "Androgens",
          marker: "Testosterone",
          result: "28.5",
          numeric_value: 28.5,
          comparator: null,
          flag: null,
          unit: "nmol/L",
          reference_range: "9.5 - 35.0",
          range_low: 9.5,
          range_high: 35,
          status: "normal",
        },
      ]
    );

    expect(merged).toHaveLength(2);
  });

  it("reports missing whitelist markers", () => {
    const missing = getMissingClinipathMarkerNames([
      {
        panel: "Androgens",
        marker: "Testosterone",
        result: "28.5",
        numeric_value: 28.5,
        comparator: null,
        flag: null,
        unit: "nmol/L",
        reference_range: "",
        range_low: null,
        range_high: null,
        status: "unknown",
      },
    ]);

    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((name) => name.includes("SHBG"))).toBe(true);
  });
});

describe("parseBloodworkPdfTextWithMeta", () => {
  it("combines structured and fallback extraction for messy OCR", () => {
    const { structuredMarkers, fallbackMarkers, finalMarkers } =
      parseBloodworkPdfTextWithMeta(MESSY_CLINIPATH_BLOB);

    expect(fallbackMarkers.length).toBeGreaterThan(structuredMarkers.length);
    expect(finalMarkers.length).toBeGreaterThanOrEqual(EXPECTED_CLINIPATH_MARKER_COUNT);
  });
});
