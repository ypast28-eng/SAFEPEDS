"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Download,
  FileText,
  Calendar,
  Building2,
  Heart,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { Table } from "@/components/ui/Table";
import { ManualEntryForm } from "./ManualEntryForm";
import {
  extractMarkersFromReport,
  fetchReportById,
  getSignedFileUrl,
  fetchReportsWithStats,
} from "@/services/bloodwork";
import { StatusBadge } from "./StatusBadge";
import { AiBloodworkReportCard } from "@/components/ai";
import { useProfile } from "@/hooks/useProfile";
import { profileToAiContext, reportToAiContext } from "@/lib/ai/transform";
import { formatLabDate, formatRefRange } from "@/utils/bloodwork";
import { formatReportStatus, canExtractBloodworkMarkers, getBloodworkResultCount, getReportStoragePath, reportHasUploadedFile } from "@/lib/bloodwork/upload";
import type { BloodworkReportWithResults, ExtractedBloodworkMarker } from "@/types/bloodwork";

interface ReportDetailViewProps {
  reportId: string;
}

export function ReportDetailView({ reportId }: ReportDetailViewProps) {
  const { profile } = useProfile();
  const [report, setReport] = useState<BloodworkReportWithResults | null>(null);
  const [historicalTrends, setHistoricalTrends] = useState<
    { marker_name: string; collection_date: string; result_value: number; unit: string; status?: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [extractedMarkers, setExtractedMarkers] = useState<ExtractedBloodworkMarker[] | null>(null);
  const [showReview, setShowReview] = useState(false);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    const { data, error: err } = await fetchReportById(reportId);
    setReport(data);
    setError(err);
    const storagePath = data ? getReportStoragePath(data) : null;
    if (storagePath) {
      const { url } = await getSignedFileUrl(storagePath);
      setFileUrl(url);
    } else if (data?.file_url?.startsWith("http")) {
      setFileUrl(data.file_url);
    } else if (data?.uploaded_file_url?.startsWith("http")) {
      setFileUrl(data.uploaded_file_url);
    } else {
      setFileUrl(null);
    }
    const { data: stats } = await fetchReportsWithStats();
    const trends = [stats.latestReport, ...stats.previousReports]
      .filter((r): r is BloodworkReportWithResults => r != null && r.id !== reportId)
      .flatMap((r) =>
        r.bloodwork_results.map((br) => ({
          marker_name: br.marker_name,
          collection_date: r.collection_date,
          result_value: Number(br.result_value),
          unit: br.unit,
          status: br.status,
        }))
      );
    setHistoricalTrends(trends);
    setIsLoading(false);
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function handleExtractMarkers() {
    if (!report) return;
    setExtractError(null);
    setExtractNotice(null);
    setIsExtracting(true);

    try {
      const outcome = await extractMarkersFromReport(report.id);

      if (outcome.setupRequired) {
        setExtractError(outcome.setupMessage);
        return;
      }

      if (outcome.error || !outcome.data) {
        setExtractError(outcome.error ?? "Extraction failed. Try again or add markers manually.");
        return;
      }

      if (outcome.data.markers.length === 0) {
        setExtractError("No markers were found in this file. Add markers manually instead.");
        return;
      }

      setExtractedMarkers(outcome.data.markers);
      setExtractNotice(
        [
          `Extracted ${outcome.data.markers.length} marker(s). Review and edit before saving.`,
          ...outcome.data.warnings,
        ].join("\n\n")
      );
      setShowReview(true);
      setReport((prev) => (prev ? { ...prev, status: "pending_review" } : prev));
    } finally {
      setIsExtracting(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted text-center py-16 animate-pulse">Loading report…</p>;
  }

  if (error || !report) {
    return (
      <Card variant="bordered" padding="lg">
        <p className="text-accent text-center">{error ?? "Report not found"}</p>
        <Link href="/bloodwork" className="block text-center mt-4">
          <Button variant="outline">Back to Bloodwork</Button>
        </Link>
      </Card>
    );
  }

  const hasUploadedFile = reportHasUploadedFile(report);
  const markerCount = getBloodworkResultCount(report);
  const canExtract = canExtractBloodworkMarkers(report);

  const tableData = (Array.isArray(report.bloodwork_results) ? report.bloodwork_results : []).map((r) => ({
    id: r.id,
    marker: r.marker_name,
    category: r.category,
    result: `${r.result_value}`,
    unit: r.unit,
    reference: formatRefRange(r.reference_low, r.reference_high, r.unit),
    status: r.status,
    date: formatLabDate(report.collection_date),
  }));

  if (showReview && extractedMarkers) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/bloodwork">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex gap-2">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  View File
                </Button>
              </a>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReview(false)}
            >
              Cancel review
            </Button>
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          <h1 className="text-2xl font-bold text-foreground">{report.report_name}</h1>
          <p className="text-sm text-muted mt-1">Review extracted markers before saving</p>
        </Card>

        <ManualEntryForm
          existingReportId={report.id}
          initialExtracted={extractedMarkers}
          reviewNotice={extractNotice}
          onSaved={() => {
            setShowReview(false);
            setExtractedMarkers(null);
            void loadReport();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href="/bloodwork">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          {canExtract && (
            <Button
              type="button"
              size="sm"
              onClick={handleExtractMarkers}
              isLoading={isExtracting}
              disabled={isExtracting}
            >
              <Sparkles className="h-4 w-4" />
              Extract markers
            </Button>
          )}
          <Link href={`/bloodwork/entry?reportId=${report.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              Add Markers
            </Button>
          </Link>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                View File
              </Button>
            </a>
          )}
        </div>
      </div>

      <Card variant="elevated" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{report.report_name}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatLabDate(report.collection_date)}
              </span>
              {report.lab_name && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {report.lab_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{formatReportStatus(report.status)}</Badge>
            <Badge variant="primary">{markerCount} markers</Badge>
            {(report.out_of_range_count ?? 0) > 0 && (
              <Badge variant="warning">{report.out_of_range_count} out of range</Badge>
            )}
            {hasUploadedFile && (
              <Badge variant="info">
                <FileText className="h-3 w-3 mr-1" />
                {report.file_name ?? "File attached"}
              </Badge>
            )}
          </div>
        </div>
        {report.notes && (
          <p className="text-sm text-muted border-t border-border/50 pt-4">{report.notes}</p>
        )}
      </Card>

      {canExtract && (
        <Card variant="elevated" padding="lg" className="border-2 border-primary/40 bg-primary/5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Extract markers from your file
                </h2>
                <p className="text-sm text-muted mt-1">
                  This report has an uploaded file ({report.file_name ?? "attached"}) but no saved
                  results yet. Analyze the PDF or image with AI, then review values before saving.
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                onClick={handleExtractMarkers}
                isLoading={isExtracting}
                disabled={isExtracting}
                className="shrink-0 w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Extract markers
              </Button>
            </div>

          {isExtracting && (
            <div
              role="status"
              className="mt-4 flex items-center gap-3 rounded-lg border border-primary/30 bg-background/50 px-4 py-3 text-sm text-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span>
                Analyzing your lab report… This may take 15–30 seconds for PDFs and images.
              </span>
            </div>
          )}

          {extractError && (
            <div
              role="alert"
              className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="whitespace-pre-line">{extractError}</p>
                  <Link
                    href={`/bloodwork/entry?reportId=${report.id}`}
                    className="inline-block text-accent underline hover:no-underline"
                  >
                    Add markers manually instead
                  </Link>
                </div>
              </div>
            </div>
          )}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Results</h2>
        {tableData.length === 0 ? (
          <Card variant="bordered" padding="lg">
            <p className="text-sm text-muted text-center py-8">
              No marker results yet.{" "}
              {canExtract ? (
                <>
                  <button
                    type="button"
                    onClick={handleExtractMarkers}
                    disabled={isExtracting}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Extract markers from your file
                  </button>
                  {" or "}
                </>
              ) : null}
              <Link href={`/bloodwork/entry?reportId=${report.id}`} className="text-primary hover:underline">
                add markers manually
              </Link>
            </p>
          </Card>
        ) : (
          <Table
            columns={[
              {
                key: "marker",
                header: "Marker",
                render: (row) => (
                  <div className="flex flex-col gap-1">
                    <span>{row.marker}</span>
                    {row.status && row.status !== "Normal" && (
                      <Link
                        href={`/health-library?marker=${encodeURIComponent(String(row.marker))}`}
                        className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
                      >
                        <Heart className="h-3 w-3" />
                        Learn More
                      </Link>
                    )}
                  </div>
                ),
              },
              { key: "category", header: "Category", className: "hidden md:table-cell" },
              { key: "result", header: "Result" },
              { key: "unit", header: "Unit", className: "hidden sm:table-cell" },
              { key: "reference", header: "Reference Range" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status as "Low" | "Normal" | "High" | null} />,
              },
              { key: "date", header: "Collection Date", className: "hidden lg:table-cell" },
            ]}
            data={tableData}
            keyField="id"
          />
        )}
      </div>

      {report.bloodwork_results.length > 0 && (
        <AiBloodworkReportCard
          request={{
            profile: profileToAiContext(profile),
            report: reportToAiContext(report),
            historical_trends: historicalTrends,
          }}
        />
      )}

      <p className="text-xs text-muted/70 text-center">
        Status is calculated from your supplied reference ranges only. Not medical advice.
      </p>
    </div>
  );
}
