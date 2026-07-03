import { describe, expect, it } from "vitest";
import { parseBloodworkPdfText, parseMarkerRow } from "@/lib/bloodwork/parseBloodworkPdf";

const EXAMPLE_ROWS = `Androgens
Testosterone 28.5 nmol/L 9.5 - 35.0
SHBG 25 nmol/L 10 - 70
Free Testosterone 710.0 pmol/L 260 - 750
General Chemistry
Urea 7.3 mmol/L 3.0 - 7.5
Creatinine 90 umol/L 60 - 110
eGFR >90 >59
Liver Function
AST 34 U/L 10 - 40
ALT 36 U/L 5 - 40
Hormones
FSH <1 L U/L 1 - 8
LH <1 L U/L 1.0 - 8.0
Oestradiol <85 pmol/L <160
Lipids
Cholesterol 4.1 mmol/L <5.0
HDL Cholesterol 1.4 mmol/L >1.0
Haematology
Haematocrit 0.48 0.40 - 0.54
Platelets 252 x10^9/L 150 - 400`;

describe("parseBloodworkPdfText", () => {
  it("extracts every example marker row", () => {
    const markers = parseBloodworkPdfText(EXAMPLE_ROWS);
    expect(markers).toHaveLength(15);

    const names = markers.map((m) => m.marker);
    expect(names).toContain("Testosterone");
    expect(names).toContain("SHBG");
    expect(names).toContain("Free Testosterone");
    expect(names).toContain("Urea");
    expect(names).toContain("Creatinine");
    expect(names).toContain("eGFR");
    expect(names).toContain("AST");
    expect(names).toContain("ALT");
    expect(names).toContain("FSH");
    expect(names).toContain("LH");
    expect(names).toContain("Oestradiol");
    expect(names).toContain("Cholesterol");
    expect(names).toContain("HDL Cholesterol");
    expect(names).toContain("Haematocrit");
    expect(names).toContain("Platelets");
  });

  it("parses FSH with low flag and comparator", () => {
    const fsh = parseMarkerRow("FSH <1 L U/L 1 - 8", "Hormones");
    expect(fsh).toMatchObject({
      panel: "Hormones",
      marker: "FSH",
      result: "<1",
      numeric_value: 1,
      comparator: "<",
      flag: "L",
      unit: "U/L",
      reference_range: "1 - 8",
      range_low: 1,
      range_high: 8,
      status: "low",
    });
  });

  it("parses eGFR with greater-than result and lower-only range", () => {
    const egfr = parseMarkerRow("eGFR >90 >59", "General Chemistry");
    expect(egfr).toMatchObject({
      marker: "eGFR",
      result: ">90",
      numeric_value: 90,
      comparator: ">",
      reference_range: ">59",
      range_low: 59,
      range_high: null,
      status: "normal",
    });
  });

  it("parses upper-bound-only lipid range", () => {
    const chol = parseMarkerRow("Cholesterol 4.1 mmol/L <5.0", "Lipids");
    expect(chol).toMatchObject({
      marker: "Cholesterol",
      result: "4.1",
      numeric_value: 4.1,
      reference_range: "<5.0",
      range_high: 5,
      status: "normal",
    });
  });

  it("parses haematocrit without units", () => {
    const hct = parseMarkerRow("Haematocrit 0.48 0.40 - 0.54", "Haematology");
    expect(hct).toMatchObject({
      marker: "Haematocrit",
      result: "0.48",
      numeric_value: 0.48,
      unit: "",
      reference_range: "0.40 - 0.54",
      status: "normal",
    });
  });

  it("parses platelets with x10^9/L unit", () => {
    const plt = parseMarkerRow("Platelets 252 x10^9/L 150 - 400", "Haematology");
    expect(plt).toMatchObject({
      marker: "Platelets",
      result: "252",
      unit: "x10^9/L",
      reference_range: "150 - 400",
      status: "normal",
    });
  });

  it("assigns panel headings dynamically", () => {
    const markers = parseBloodworkPdfText(EXAMPLE_ROWS);
    expect(markers.find((m) => m.marker === "AST")?.panel).toBe("Liver Function");
    expect(markers.find((m) => m.marker === "FSH")?.panel).toBe("Hormones");
    expect(markers.find((m) => m.marker === "Testosterone")?.panel).toBe("Androgens");
  });
});
