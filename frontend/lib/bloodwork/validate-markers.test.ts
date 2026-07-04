import { describe, expect, it } from "vitest";
import {
  adaptRawExtractedMarker,
  prepareMarkersForInsert,
} from "@/lib/bloodwork/validate-markers";

describe("prepareMarkersForInsert", () => {
  it("skips markers with empty names", () => {
    const { valid, skipped } = prepareMarkersForInsert([
      {
        category: "Liver Function",
        marker_name: "   ",
        result_value: "5",
        unit: "U/L",
      },
      {
        category: "Liver Function",
        marker_name: "ALT",
        result_value: "36",
        unit: "U/L",
        reference_range: "5 - 40",
      },
    ]);

    expect(valid).toHaveLength(1);
    expect(valid[0]?.marker_name).toBe("ALT");
    expect(skipped).toHaveLength(1);
  });

  it("deduplicates markers by category and marker name", () => {
    const { valid, skipped } = prepareMarkersForInsert([
      {
        category: "Liver Function",
        marker_name: "ALT",
        result_value: "36",
        unit: "U/L",
        reference_range: "5 - 40",
      },
      {
        category: "Liver Function",
        marker_name: " alt ",
        result_value: "40",
        unit: "U/L",
        reference_range: "5 - 40",
      },
    ]);

    expect(valid).toHaveLength(1);
    expect(skipped.some((s) => s.reason === "Duplicate marker in category")).toBe(true);
  });

  it("adapts alternate parser field names", () => {
    const adapted = adaptRawExtractedMarker({
      category: "Haematology",
      marker: "Haemoglobin",
      result: "145",
      units: "g/L",
      reference_range: "130 - 180",
    });

    expect(adapted).toMatchObject({
      marker_name: "Haemoglobin",
      category: "Haematology",
      result_value: 145,
      unit: "g/L",
    });
  });

  it("preserves comparator symbols in result values", () => {
    const { valid } = prepareMarkersForInsert([
      {
        category: "Hormones",
        marker_name: "Oestradiol",
        result: "<85",
        unit: "pmol/L",
        reference_range: "<160",
      },
    ]);

    expect(valid[0]?.result_text).toBe("<85");
    expect(valid[0]?.reference_range).toBe("<160");
  });

  it("accepts comparator results with low flags", () => {
    const { valid } = prepareMarkersForInsert([
      {
        category: "Hormones",
        marker_name: "FSH",
        result: "<1",
        unit: "U/L",
        reference_range: "1 - 8",
      },
    ]);

    expect(valid[0]?.result_text).toBe("<1");
    expect(valid[0]?.numeric_value).toBe(1);
  });

  it("allows null units for ratio markers", () => {
    const { valid } = prepareMarkersForInsert([
      {
        category: "Lipids",
        marker_name: "Chol/HDL Ratio",
        result: "2.9",
        unit: "",
        reference_range: "<5.0",
      },
    ]);

    expect(valid[0]?.unit).toBe("");
    expect(valid[0]?.result_text).toBe("2.9");
  });
});
