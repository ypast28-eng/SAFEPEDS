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
