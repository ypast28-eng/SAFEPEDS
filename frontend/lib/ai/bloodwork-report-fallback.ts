import { AI_DISCLAIMER } from "@/lib/ai/openai-config";
import type { AiBloodworkReportRequest, AiBloodworkReportResult, OutOfRangeMarker } from "@/types/ai";

export function generateBloodworkReportFallback(
  request: AiBloodworkReportRequest
): AiBloodworkReportResult {
  const report = request.report;
  const markers = report.markers ?? [];
  const normal = markers.filter((m) => m.status === "Normal").map((m) => m.marker_name);
  const outOfRange: OutOfRangeMarker[] = [];

  for (const m of markers) {
    if (m.status !== "Low" && m.status !== "High") continue;

    let referenceRange: string | null = null;
    if (m.reference_low != null && m.reference_high != null) {
      referenceRange = `${m.reference_low}–${m.reference_high} ${m.unit}`;
    }

    outOfRange.push({
      marker_name: m.marker_name,
      result_value: m.result_value,
      unit: m.unit,
      status: m.status,
      reference_range: referenceRange,
      educational_note: `${m.marker_name} is ${m.status.toLowerCase()} relative to your supplied laboratory reference range. This is not a diagnosis — discuss with your healthcare provider using the ranges on your lab report.`,
    });
  }

  const trends = request.historical_trends ?? [];
  let historicalComparison = `This report contains ${markers.length} marker(s). ${normal.length} within your supplied reference range, ${outOfRange.length} outside range.`;
  if (trends.length > 0) {
    historicalComparison += ` Historical trend data includes ${trends.length} prior data point(s) for comparison.`;
  }

  const monitoring: string[] = [];
  if (outOfRange.length > 0) {
    monitoring.push(
      "Markers outside your supplied reference range may warrant discussion with a clinician."
    );
  }
  monitoring.push("Continue logging bloodwork at regular intervals for trend analysis.");

  return {
    overview: `Educational overview of "${report.report_name}" collected on ${report.collection_date ?? "unknown date"}. Status labels are based solely on reference ranges you provided.`,
    normal_markers: normal,
    out_of_range_markers: outOfRange,
    historical_comparison: historicalComparison,
    monitoring_considerations: monitoring,
    related_articles: [],
    scientific_references: [],
    disclaimer: AI_DISCLAIMER,
  };
}
