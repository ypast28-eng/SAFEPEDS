/** Bloodwork marker status — based on user-supplied reference ranges only */

export type BloodworkStatus = "Low" | "Normal" | "High";

export interface BloodMarker {
  id: string;
  name: string;
  category: string;
  default_unit: string | null;
  default_reference_low: number | null;
  default_reference_high: number | null;
  display_order: number;
  active: boolean;
  created_at: string;
}

/** Bloodwork report processing status */
export type BloodworkReportStatus = "uploaded" | "pending_review" | "complete";

/** Cruise = maintenance baseline; blast = higher-dose cycle phase */
export type BloodworkPhase = "cruise" | "blast" | "unknown";
export type BloodworkPhaseInput = "cruise" | "blast";

export interface BloodworkReport {
  id: string;
  user_id: string;
  report_name: string;
  lab_name: string | null;
  collection_date: string;
  /** Null on legacy reports uploaded before phase tracking */
  phase: BloodworkPhase | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  file_path: string | null;
  file_url: string | null;
  uploaded_file_url: string | null;
  status: BloodworkReportStatus;
  notes: string | null;
  extraction_snapshot?: StructuredBloodworkMarker[] | null;
  created_at: string;
  updated_at: string;
}

export interface BloodworkResult {
  id: string;
  report_id: string;
  marker_name: string;
  category: string;
  result_value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  status: BloodworkStatus | null;
  result_text: string | null;
  comparator: string | null;
  flag: string | null;
  reference_range: string | null;
  created_at: string;
}

export interface BloodworkHistoryPoint {
  id: string;
  user_id: string;
  marker_name: string;
  result_value: number;
  unit: string;
  collection_date: string;
  report_id: string | null;
  created_at: string;
}

export interface BloodworkReportWithResults extends BloodworkReport {
  bloodwork_results: BloodworkResult[];
  out_of_range_count?: number;
}

export interface BloodworkDashboardStats {
  totalReports: number;
  latestReport: BloodworkReportWithResults | null;
  previousReports: BloodworkReportWithResults[];
  totalOutOfRange: number;
  latestCruiseReport: BloodworkReportWithResults | null;
  latestBlastReport: BloodworkReportWithResults | null;
  hasCruiseBaseline: boolean;
}

/** Manual entry line item */
export interface BloodworkResultInput {
  marker_name: string;
  category: string;
  result_value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  status?: BloodworkStatus | null;
  result_text?: string | null;
  comparator?: string | null;
  flag?: string | null;
  reference_range?: string | null;
}

/** Editable marker row — existing results include `id` */
export interface EditableBloodworkResultInput extends BloodworkResultInput {
  id?: string;
}

export interface UpdateBloodworkReportInput {
  report_name: string;
  lab_name?: string | null;
  collection_date: string;
  notes?: string | null;
  phase?: BloodworkPhaseInput | null;
  results: EditableBloodworkResultInput[];
  deleted_result_ids?: string[];
}

/** Marker returned from AI extraction API (pre-save review) */
export interface ExtractedBloodworkMarker extends BloodworkResultInput {
  marker_id: string | null;
  raw_name: string;
  matched: boolean;
}

export interface StructuredBloodworkMarker {
  panel: string;
  marker: string;
  result: string;
  numeric_value: number | null;
  comparator: string | null;
  flag: string | null;
  unit: string;
  reference_range: string;
  range_low: number | null;
  range_high: number | null;
  status: "low" | "normal" | "high" | "unknown";
}

export interface BloodworkExtractionResult {
  markers: ExtractedBloodworkMarker[];
  structured_markers: StructuredBloodworkMarker[];
  warnings: string[];
  extractedCount: number;
  matchedCount: number;
  saved: boolean;
  parser: "pdf" | "openai";
}

export interface CreateReportInput {
  report_name: string;
  lab_name?: string;
  collection_date: string;
  phase: BloodworkPhaseInput;
  notes?: string;
  results: BloodworkResultInput[];
  file_name?: string;
  file_type?: string;
  status?: BloodworkReportStatus;
}

export const BLOODWORK_UPLOAD_ACCEPT = "application/pdf,image/jpeg,image/png";
export const BLOODWORK_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export type TrendTimeRange = "3m" | "6m" | "12m" | "all";

/** Markers featured on trend dashboard — resolved against blood_markers by name */
export const TREND_MARKER_NAMES = [
  "ALT",
  "AST",
  "HDL",
  "LDL",
  "Triglycerides",
  "Creatinine",
  "eGFR",
  "Hematocrit",
  "Total Testosterone",
  "Estradiol",
] as const;

export type TrendMarkerName = (typeof TREND_MARKER_NAMES)[number];
