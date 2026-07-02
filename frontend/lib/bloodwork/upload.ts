import type { BloodworkReportStatus } from "@/types/bloodwork";
import { BLOODWORK_UPLOAD_ACCEPT, BLOODWORK_UPLOAD_MAX_BYTES } from "@/types/bloodwork";

const ALLOWED_TYPES = new Set(BLOODWORK_UPLOAD_ACCEPT.split(","));

export function validateBloodworkUploadFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please upload a PDF, JPG, or PNG file.";
  }
  if (file.size > BLOODWORK_UPLOAD_MAX_BYTES) {
    return "File must be 20 MB or smaller.";
  }
  return null;
}

export function isImageMimeType(mime: string | null | undefined): boolean {
  return Boolean(mime?.startsWith("image/"));
}

export function formatReportStatus(status: BloodworkReportStatus): string {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "pending_review":
      return "Pending review";
    case "complete":
      return "Complete";
    default:
      return status;
  }
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Storage object path in bucket bloodwork-reports (not a signed/public URL). */
export function getReportStoragePath(report: {
  file_path?: string | null;
  uploaded_file_url?: string | null;
}): string | null {
  const path =
    nonEmptyString(report.file_path) ?? nonEmptyString(report.uploaded_file_url);
  if (!path) return null;
  // Legacy rows may store a full URL in uploaded_file_url — not a storage path.
  if (path.startsWith("http://") || path.startsWith("https://")) return null;
  return path;
}

/** Whether the report row references an uploaded file (path, legacy path, or cached URL). */
export function reportHasUploadedFile(report: {
  file_path?: string | null;
  uploaded_file_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
}): boolean {
  return Boolean(
    getReportStoragePath(report) ??
      nonEmptyString(report.file_url) ??
      nonEmptyString(report.uploaded_file_url)
  );
}

export function getBloodworkResultCount(report: { bloodwork_results?: unknown }): number {
  return Array.isArray(report.bloodwork_results) ? report.bloodwork_results.length : 0;
}

/** True when a file is attached and no results have been saved yet. */
export function canExtractBloodworkMarkers(report: {
  file_path?: string | null;
  uploaded_file_url?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  bloodwork_results?: unknown;
}): boolean {
  return reportHasUploadedFile(report) && getBloodworkResultCount(report) === 0;
}
