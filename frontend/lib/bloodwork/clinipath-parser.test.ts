import { describe, expect, it } from "vitest";
import {
  EXPECTED_CLINIPATH_MARKER_COUNT,
  parseClinipathPdfText,
  parseClinipathValueChunk,
  splitClinipathCategoryBlocks,
} from "@/lib/bloodwork/clinipath-parser";

const STACKED_GENERAL_CHEMISTRY = `General Chemistry
Urea
Creatinine
eGFR
Sodium
Potassium
Chloride
Bicarbonate
7.3
90
>90
140
3.9
104
24
mmol/L
umol/L
mL/min/1.73m2
mmol/L
mmol/L
mmol/L
mmol/L
3.0 - 7.5
60 - 110
>59
135 - 145
3.5 - 5.5
95 - 110
20 - 32`;

const INLINE_ANDROGENS = `Androgens
Testosterone 28.5 nmol/L 9.5 - 35.0
SHBG 25 nmol/L 10 - 70
Free Testosterone 710.0 pmol/L 260 - 750`;

const WRAPPED_HORMONES = `Hormones
FSH
<1
U/L
1 - 8
LH
<1
U/L
1.0 - 8.0
Oestradiol
<85
pmol/L
<160`;

describe("parseClinipathValueChunk", () => {
  it("parses comparator results with units and references", () => {
    expect(parseClinipathValueChunk(">90 mL/min/1.73m2 >59")).toMatchObject({
      result: ">90",
      unit: "mL/min/1.73m²",
      reference_range: ">59",
    });
    expect(parseClinipathValueChunk("<1 U/L 1 - 8")).toMatchObject({
      result: "<1",
      unit: "U/L",
      reference_range: "1 - 8",
    });
    expect(parseClinipathValueChunk("2.9 <5.0")).toMatchObject({
      result: "2.9",
      unit: null,
      reference_range: "<5.0",
    });
  });
});

describe("parseClinipathPdfText", () => {
  it("extracts all General Chemistry markers from stacked column layout", () => {
    const markers = parseClinipathPdfText(STACKED_GENERAL_CHEMISTRY);
    const gc = markers.filter((m) => m.panel === "General Chemistry");

    expect(gc).toHaveLength(7);
    expect(gc.find((m) => m.marker === "Urea")).toMatchObject({
      result: "7.3",
      unit: "mmol/L",
      reference_range: "3.0 - 7.5",
    });
    expect(gc.find((m) => m.marker === "eGFR")).toMatchObject({
      result: ">90",
      unit: "mL/min/1.73m²",
      reference_range: ">59",
    });
  });

  it("extracts all Androgens markers from inline rows", () => {
    const markers = parseClinipathPdfText(INLINE_ANDROGENS);
    const androgens = markers.filter((m) => m.panel === "Androgens");

    expect(androgens).toHaveLength(3);
    expect(androgens.map((m) => m.marker)).toEqual(
      expect.arrayContaining(["Testosterone", "SHBG", "Free Testosterone"])
    );
  });

  it("extracts Hormones from wrapped multi-line rows", () => {
    const markers = parseClinipathPdfText(WRAPPED_HORMONES);
    const hormones = markers.filter((m) => m.panel === "Hormones");

    expect(hormones).toHaveLength(3);
    expect(hormones.find((m) => m.marker === "FSH")).toMatchObject({
      result: "<1",
      unit: "U/L",
      reference_range: "1 - 8",
    });
  });

  it("splits category blocks from combined report text", () => {
    const text = `${INLINE_ANDROGENS}\n${STACKED_GENERAL_CHEMISTRY}\n${WRAPPED_HORMONES}`;
    const blocks = splitClinipathCategoryBlocks(text);

    expect(blocks.has("Androgens")).toBe(true);
    expect(blocks.has("General Chemistry")).toBe(true);
    expect(blocks.has("Hormones")).toBe(true);

    const markers = parseClinipathPdfText(text);
    expect(markers.length).toBeGreaterThanOrEqual(13);
    expect(markers.length).toBeLessThan(EXPECTED_CLINIPATH_MARKER_COUNT);
  });
});
