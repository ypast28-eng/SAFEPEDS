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

export interface BloodworkReport {
  id: string;
  user_id: string;
  report_name: string;
  lab_name: string | null;
  collection_date: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  file_path: string | null;
  file_url: string | null;
  uploaded_file_url: string | null;
  status: BloodworkReportStatus;
  notes: string | null;
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
}

/** Manual entry line item */
export interface BloodworkResultInput {
  marker_name: string;
  category: string;
  result_value: number;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
}

export interface CreateReportInput {
  report_name: string;
  lab_name?: string;
  collection_date: string;
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
