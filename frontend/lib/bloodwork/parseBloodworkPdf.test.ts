import { describe, expect, it } from "vitest";
import {
  isApprovedBloodworkMarker,
  resolveApprovedMarkerName,
  resolveCategoryHeading,
  stripUnitsFromMarkerText,
  toDisplayMarkerName,
} from "@/lib/bloodwork/approved-markers";
import {
  extractSectionTables,
  parseBloodworkPdfText,
  parseMarkerRow,
} from "@/lib/bloodwork/parseBloodworkPdf";
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
Chloride 102 mmol/L 95 - 110
Bicarbonate 26 mmol/L 22 - 32
Liver Function
AST 34 U/L 10 - 40
ALT 36 U/L 5 - 40
Alk Phos 72 U/L 30 - 120
Gamma GT 28 U/L 5 - 50
Total Bilirubin 12 umol/L 3 - 20
Total Protein 72 g/L 60 - 80
Albumin 42 g/L 35 - 50
Globulin 30 g/L 20 - 40
Hormones
FSH <1 L U/L 1 - 8
LH <1 L U/L 1.0 - 8.0
Oestradiol <85 pmol/L <160
Lipids
Random
Cholesterol 4.1 mmol/L <5.0
Triglyceride 0.9 mmol/L <2.0
HDL Cholesterol 1.4 mmol/L >1.0
Chol/HDL Ratio 2.9 <5.0
LDL Cholesterol 2.2 mmol/L <3.0
Non HDL Cholesterol 2.7 mmol/L <4.0
Haematology
Haemoglobin 145 g/L 130 - 180
Red cell count 4.8 x10^12/L 4.5 - 5.5
Haematocrit 0.48 0.40 - 0.54
MCV 88 fL 80 - 100
MCH 30 pg 27 - 33
MCHC 330 g/L 320 - 360
RDW 13 % 11 - 15
White cell count 6.2 x10^9/L 4.0 - 11.0
Neutrophils 3.5 x10^9/L 2.0 - 7.5
Lymphocytes 2.1 x10^9/L 1.0 - 4.0
Monocytes 0.5 x10^9/L 0.2 - 1.0
Eosinophils 0.1 x10^9/L 0.0 - 0.5
Basophils <0.1 x10^9/L 0.0 - 0.2
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

  it("normalizes display names", () => {
    expect(toDisplayMarkerName("Cholesterol")).toBe("Total Cholesterol");
    expect(toDisplayMarkerName("Red cell count")).toBe("Red Cell Count");
    expect(toDisplayMarkerName("Testosterone")).toBe("Testosterone");
    expect(isApprovedBloodworkMarker("Lipids", "Total Cholesterol")).toBe(true);
  });
});

describe("parseBloodworkPdfText", () => {
  it("extracts all approved markers from a full Clinipath-style report", () => {
    const markers = parseBloodworkPdfText(EXAMPLE_REPORT);

    expect(markers.every((m) => isApprovedBloodworkMarker(m.panel, m.marker))).toBe(true);
    expect(markers).toHaveLength(41);
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

  it("parses FSH with comparator, units, and reference range", () => {
    const fsh = parseMarkerRow("FSH <1 U/L 1 - 8", "Hormones");
    expect(fsh).toMatchObject({
      panel: "Hormones",
      marker: "FSH",
      result: "<1",
      unit: "U/L",
      reference_range: "1 - 8",
      status: "low",
    });
  });

  it("parses eGFR and oestradiol comparator results", () => {
    const markers = parseBloodworkPdfText(`General Chemistry
eGFR >90 >59
Hormones
Oestradiol <85 pmol/L <160`);

    expect(markers.find((m) => m.marker === "eGFR")).toMatchObject({ result: ">90" });
    expect(markers.find((m) => m.marker === "Oestradiol")).toMatchObject({
      result: "<85",
      unit: "pmol/L",
    });
  });

  it("parses Chol/HDL Ratio without units", () => {
    const marker = parseMarkerRow("Chol/HDL Ratio 2.9 <5.0", "Lipids");
    expect(marker).toMatchObject({
      marker: "Chol/HDL Ratio",
      result: "2.9",
      unit: null,
      reference_range: "<5.0",
    });
  });

  it("parses lipids layout and ignores Random header line", () => {
    const markers = parseBloodworkPdfText(`Lipids
Random
Cholesterol 4.1 mmol/L <5.0
HDL Cholesterol 1.4 mmol/L >1.0`);

    expect(markers.map((m) => m.marker)).toEqual(
      expect.arrayContaining(["Total Cholesterol", "HDL Cholesterol"])
    );
  });

  it("extracts section tables for logging and fallback parsing", () => {
    const tables = extractSectionTables(EXAMPLE_REPORT);
    expect(tables.map((t) => t.category)).toEqual([
      "Androgens",
      "General Chemistry",
      "Liver Function",
      "Hormones",
      "Lipids",
      "Haematology",
    ]);
    expect(tables.find((t) => t.category === "Androgens")?.lines).toHaveLength(3);
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
