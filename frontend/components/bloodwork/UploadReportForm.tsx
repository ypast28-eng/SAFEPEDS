"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Button, Card, Input, Textarea, Badge } from "@/components/ui";
import { ManualEntryForm } from "./ManualEntryForm";
import { useAuth } from "@/hooks/useAuth";
import {
  createReportWithFile,
  getSignedFileUrl,
  updateReportStatus,
} from "@/services/bloodwork";
import {
  formatReportStatus,
  getReportStoragePath,
  isImageMimeType,
  validateBloodworkUploadFile,
} from "@/lib/bloodwork/upload";
import { BLOODWORK_UPLOAD_ACCEPT } from "@/types/bloodwork";
import type { BloodworkReport } from "@/types/bloodwork";
import { cn } from "@/utils/cn";

type UploadStep = "form" | "uploaded" | "manual";

export function UploadReportForm() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<UploadStep>("form");
  const [reportName, setReportName] = useState("");
  const [labName, setLabName] = useState("");
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedReport, setUploadedReport] = useState<BloodworkReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !isImageMimeType(file.type)) {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = useCallback((next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    const validationError = validateBloodworkUploadFile(next);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(next);
    if (!reportName.trim()) {
      const base = next.name.replace(/\.[^.]+$/, "");
      setReportName(base || "Lab Report");
    }
  }, [reportName]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in to upload reports.");
      return;
    }
    if (!reportName.trim()) {
      setError("Please enter a report name.");
      return;
    }
    if (!collectionDate) {
      setError("Please enter a collection date.");
      return;
    }
    if (!file) {
      setError("Please choose a PDF, JPG, or PNG file.");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error: uploadError } = await createReportWithFile(
        user.id,
        {
          report_name: reportName,
          lab_name: labName,
          collection_date: collectionDate,
          notes,
        },
        file
      );

      if (uploadError || !data) {
        setError(uploadError ?? "Upload failed. Please try again.");
        return;
      }

      setUploadedReport(data);
      const storagePath = getReportStoragePath(data) ?? "";
      const { url, error: urlError } = await getSignedFileUrl(storagePath);
      if (urlError) {
        setError(`Report saved but preview failed: ${urlError}`);
      }
      setPreviewUrl(url);
      setStep("uploaded");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleExtractMarkers() {
    if (!uploadedReport) return;
    setError(null);
    setExtractNotice(null);
    setIsExtracting(true);

    try {
      const { error: statusError } = await updateReportStatus(
        uploadedReport.id,
        "pending_review"
      );
      if (statusError) {
        setError(statusError);
        return;
      }

      setExtractNotice(
        "Automatic extraction is not available yet. Enter marker values manually from your uploaded report."
      );
      setStep("manual");
    } finally {
      setIsExtracting(false);
    }
  }

  if (step === "manual" && uploadedReport) {
    return (
      <div className="space-y-6">
        <Card variant="bordered" padding="md" className="border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Manual review</p>
              <p className="text-sm text-muted mt-1">
                {extractNotice ??
                  "Enter the marker values shown on your uploaded report."}
              </p>
              {uploadedReport.file_name && (
                <p className="text-xs text-muted mt-2">File: {uploadedReport.file_name}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    View file
                  </Button>
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/bloodwork/reports/${uploadedReport.id}`)}
              >
                Skip to report
              </Button>
            </div>
          </div>
        </Card>
        <ManualEntryForm existingReportId={uploadedReport.id} />
      </div>
    );
  }

  if (step === "uploaded" && uploadedReport) {
    const isImage = isImageMimeType(uploadedReport.file_type);
    return (
      <div className="space-y-6">
        <Card variant="elevated" padding="lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-foreground">Upload complete</h3>
              <p className="text-sm text-muted mt-1">
                Your report was saved to Supabase Storage and linked to your account.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="primary">{uploadedReport.report_name}</Badge>
            <Badge variant="default">{formatReportStatus(uploadedReport.status)}</Badge>
            {uploadedReport.file_name && (
              <Badge variant="info">{uploadedReport.file_name}</Badge>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-surface/50 overflow-hidden">
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={uploadedReport.file_name ?? "Uploaded bloodwork report"}
                className="max-h-96 w-full object-contain bg-black/20"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <FileText className="h-12 w-12 text-muted mb-3" />
                <p className="text-sm text-foreground font-medium">
                  {uploadedReport.file_name ?? "PDF document"}
                </p>
                <p className="text-xs text-muted mt-1">PDF preview opens in a new tab</p>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4"
                  >
                    <Button type="button" variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Open PDF
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              type="button"
              onClick={handleExtractMarkers}
              isLoading={isExtracting}
              className="sm:flex-1"
            >
              <Sparkles className="h-4 w-4" />
              Extract markers
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/bloodwork/reports/${uploadedReport.id}`)}
            >
              View report details
            </Button>
          </div>

          <p className="text-xs text-muted mt-4">
            Automatic OCR is not enabled yet. Extract markers opens a manual entry screen so you
            can type values from your lab report.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <Card variant="elevated" padding="lg">
        <h3 className="text-base font-semibold text-foreground mb-4">Report Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Report Name"
            placeholder="e.g. Q1 2026 Panel"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            required
          />
          <Input
            label="Laboratory Name"
            placeholder="e.g. Quest Diagnostics"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
          />
          <Input
            label="Collection Date"
            type="date"
            value={collectionDate}
            onChange={(e) => setCollectionDate(e.target.value)}
            required
          />
          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              placeholder="Optional notes about this panel…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="text-base font-semibold text-foreground mb-2">Upload file</h3>
        <p className="text-sm text-muted mb-4">PDF, JPG, or PNG — max 20 MB</p>

        <label
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
            file
              ? "border-primary/40 bg-primary/5"
              : "border-border/60 hover:border-primary/30 hover:bg-surface/50"
          )}
        >
          <input
            type="file"
            accept={BLOODWORK_UPLOAD_ACCEPT}
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              {isImageMimeType(file.type) ? (
                <ImageIcon className="h-8 w-8 text-primary" />
              ) : (
                <FileText className="h-8 w-8 text-primary" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {localPreviewUrl && (
                <img
                  src={localPreviewUrl}
                  alt="Preview"
                  className="mt-2 max-h-40 rounded-lg border border-border/50"
                />
              )}
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted">Click to choose a file or drag it here</p>
            </>
          )}
        </label>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/bloodwork" className="sm:mr-auto">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" isLoading={isUploading} disabled={!file || isUploading}>
          <Upload className="h-4 w-4" />
          Upload report
        </Button>
      </div>
    </form>
  );
}
