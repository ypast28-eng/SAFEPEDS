import { describe, expect, it } from "vitest";
import { normalizeBloodworkResult } from "@/lib/bloodwork/normalize-result";
import { bloodworkResultToDbFields, toBloodworkResultRow } from "@/lib/bloodwork/result-row";

describe("bloodwork result row mapping", () => {
  it("maps structured inputs to canonical database columns only", () => {
    const row = toBloodworkResultRow("report-1", "user-1", {
      marker_name: "ALT",
      category: "Liver",
      result_value: 42,
      unit: "U/L",
      reference_low: 10,
      reference_high: 40,
      result_text: "42",
      comparator: null,
      flag: "H",
      reference_range: "10 - 40",
    });

    expect(row).toEqual({
      report_id: "report-1",
      user_id: "user-1",
      panel: "Liver",
      marker: "ALT",
      result: "42",
      numeric_value: 42,
      comparator: null,
      flag: "H",
      unit: "U/L",
      reference_range: "10 - 40",
      range_low: 10,
      range_high: 40,
      status: "High",
    });
    expect(row).not.toHaveProperty("marker_name");
    expect(row).not.toHaveProperty("category");
    expect(row).not.toHaveProperty("result_value");
    expect(row).not.toHaveProperty("reference_low");
    expect(row).not.toHaveProperty("reference_high");
    expect(row).not.toHaveProperty("result_text");
  });

  it("normalizes legacy database rows into app-facing aliases", () => {
    const normalized = normalizeBloodworkResult({
      id: "r1",
      report_id: "report-1",
      marker_name: "AST",
      category: "Liver",
      result_value: 25,
      unit: "U/L",
      reference_low: 10,
      reference_high: 40,
      status: "Normal",
      created_at: "2026-01-01T00:00:00Z",
    });

    expect(normalized.marker).toBe("AST");
    expect(normalized.marker_name).toBe("AST");
    expect(normalized.panel).toBe("Liver");
    expect(normalized.category).toBe("Liver");
    expect(normalized.numeric_value).toBe(25);
    expect(normalized.result_value).toBe(25);
    expect(normalized.range_low).toBe(10);
    expect(normalized.reference_low).toBe(10);
  });

  it("prefers structured columns when reading from the database", () => {
    const normalized = normalizeBloodworkResult({
      id: "r2",
      report_id: "report-1",
      panel: "Lipids",
      marker: "HDL",
      result: "<40",
      numeric_value: 40,
      comparator: "<",
      flag: "L",
      unit: "mg/dL",
      reference_range: ">40",
      range_low: 40,
      range_high: null,
      status: "Low",
      created_at: "2026-01-01T00:00:00Z",
      marker_name: "legacy",
      category: "legacy",
      result_value: 1,
      reference_low: 1,
      reference_high: 2,
    });

    expect(normalized.marker).toBe("HDL");
    expect(normalized.result).toBe("<40");
    expect(normalized.comparator).toBe("<");
    expect(normalized.flag).toBe("L");
  });

  it("derives reference_range when missing", () => {
    const fields = bloodworkResultToDbFields({
      marker_name: "Creatinine",
      category: "Kidney",
      result_value: 1.1,
      unit: "mg/dL",
      reference_low: 0.7,
      reference_high: 1.3,
    });

    expect(fields.reference_range).toBe("0.7 – 1.3 mg/dL");
  });
});
