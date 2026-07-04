import { describe, expect, it } from "vitest";
import {
  isApprovedBloodworkMarker,
  resolveApprovedMarkerName,
  resolveCategoryHeading,
  stripUnitsFromMarkerText,
} from "@/lib/bloodwork/approved-markers";
import { parseBloodworkPdfText, parseMarkerRow } from "@/lib/bloodwork/parseBloodworkPdf";
import { prepareMarkersForInsert } from "@/lib/bloodwork/validate-markers";
import { runStrictExtractionPipeline } from "@/lib/bloodwork/extraction-pipeline";

const EXAMPLE_REPORT = `Patient Name John Smith
Collection Date 01/01/2026
Androgens
Testosterone 28.5 nmol/L 9.5 - 35.0
SHBG 25 nmol/L 10 - 70
Free Testosterone 710.0 pmol/L 260 - 750
General Chemistry
Urea 7.3 mmol/L 3.0 - 7.5
Creatinine 90 umol/L 60 - 110
eGFR >90 >59
Sodium 140 mmol/L 135 - 145
Potassium 4.2 mmol/L 3.5 - 5.2
Liver Function
AST 34 U/L 10 - 40
ALT 36 U/L 5 - 40
Gamma GT 28 U/L 5 - 50
Total Bilirubin 12 umol/L 3 - 20
Albumin 42 g/L 35 - 50
Hormones
FSH <1 L U/L 1 - 8
LH <1 L U/L 1.0 - 8.0
Oestradiol <85 pmol/L <160
Lipids
Random
Cholesterol 4.1 mmol/L <5.0
Triglyceride 0.9 mmol/L <2.0
HDL Cholesterol 1.4 mmol/L >1.0
LDL Cholesterol 2.2 mmol/L <3.0
Haematology
Haemoglobin 145 g/L 130 - 180
Red cell count 4.8 x10^12/L 4.5 - 5.5
Haematocrit 0.48 0.40 - 0.54
White cell count 6.2 x10^9/L 4.0 - 11.0
Platelets 252 x10^9/L 150 - 400
Comments: sample slightly haemolysed`;

describe("approved markers", () => {
  it("resolves category headings only for approved panels", () => {
    expect(resolveCategoryHeading("Androgens")).toBe("Androgens");
    expect(resolveCategoryHeading("Patient Name John Smith")).toBeNull();
    expect(resolveCategoryHeading("Comments: sample slightly haemolysed")).toBeNull();
  });

  it("strips units from marker names", () => {
    expect(stripUnitsFromMarkerText("Testosterone nmol/L")).toBe("Testosterone");
  });

  it("maps aliases to canonical marker names", () => {
    expect(resolveApprovedMarkerName("GGT", "Liver Function")).toBe("Gamma GT");
    expect(resolveApprovedMarkerName("RBC", "Haematology")).toBe("Red cell count");
  });
});

describe("parseBloodworkPdfText", () => {
  it("extracts only approved markers inside pathology tables", () => {
    const markers = parseBloodworkPdfText(EXAMPLE_REPORT);

    expect(markers.every((m) => isApprovedBloodworkMarker(m.panel, m.marker))).toBe(true);
    expect(markers.find((m) => m.marker === "Testosterone")).toMatchObject({
      panel: "Androgens",
      marker: "Testosterone",
      result: "28.5",
      unit: "nmol/L",
      reference_range: "9.5 - 35.0",
    });
    expect(markers.some((m) => m.marker.includes("nmol/L"))).toBe(false);
    expect(markers.some((m) => m.marker === "Random")).toBe(false);
    expect(markers.some((m) => m.marker === "John Smith")).toBe(false);
  });

  it("parses FSH with comparator, flag, units, and reference range", () => {
    const fsh = parseMarkerRow("FSH <1 L U/L 1 - 8", "Hormones");
    expect(fsh).toMatchObject({
      panel: "Hormones",
      marker: "FSH",
      result: "<1",
      unit: "U/L",
      reference_range: "1 - 8",
      status: "low",
    });
  });

  it("parses lipids layout and ignores Random header line", () => {
    const markers = parseBloodworkPdfText(`Lipids
Random
Cholesterol 4.1 mmol/L <5.0
HDL Cholesterol 1.4 mmol/L >1.0`);

    expect(markers.map((m) => m.marker)).toEqual(["Cholesterol", "HDL Cholesterol"]);
  });

  it("deduplicates by category and marker", () => {
    const pipeline = runStrictExtractionPipeline(
      parseBloodworkPdfText(`Androgens
Testosterone 28.5 nmol/L 9.5 - 35.0
Testosterone 28.5 nmol/L 9.5 - 35.0`)
    );

    expect(pipeline.validMarkers).toHaveLength(1);
  });
});

describe("prepareMarkersForInsert", () => {
  it("rejects category headings and unapproved markers", () => {
    const { valid, skipped } = prepareMarkersForInsert([
      {
        category: "Androgens",
        marker_name: "Androgens",
        result_value: "1",
        unit: "",
      },
      {
        category: "Androgens",
        marker_name: "Testosterone",
        result_value: "28.5",
        unit: "nmol/L",
        reference_range: "9.5 - 35.0",
      },
      {
        category: "Androgens",
        marker_name: "Prolactin",
        result_value: "10",
        unit: "mIU/L",
      },
    ]);

    expect(valid).toHaveLength(1);
    expect(valid[0]?.marker_name).toBe("Testosterone");
    expect(skipped.length).toBeGreaterThanOrEqual(2);
  });
});
