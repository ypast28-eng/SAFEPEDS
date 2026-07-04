import { describe, expect, it } from "vitest";
import { sortBloodworkReportsByRecency } from "@/lib/bloodwork/report-sort";

describe("sortBloodworkReportsByRecency", () => {
  it("sorts by collection_date descending", () => {
    const sorted = sortBloodworkReportsByRecency([
      { id: "a", collection_date: "2026-01-01", created_at: "2026-01-01T10:00:00Z" },
      { id: "b", collection_date: "2026-06-01", created_at: "2026-01-01T10:00:00Z" },
    ] as const);

    expect(sorted.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("uses created_at descending when collection dates match", () => {
    const sorted = sortBloodworkReportsByRecency([
      { id: "older", collection_date: "2026-07-04", created_at: "2026-07-04T08:00:00Z" },
      { id: "newer", collection_date: "2026-07-04", created_at: "2026-07-04T10:00:00Z" },
    ] as const);

    expect(sorted.map((r) => r.id)).toEqual(["newer", "older"]);
  });
});
