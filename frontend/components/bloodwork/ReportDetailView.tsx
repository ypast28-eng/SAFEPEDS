"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Download, FileText, Calendar, Building2, Heart } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { Table } from "@/components/ui/Table";
import { fetchReportById, getSignedFileUrl, fetchReportsWithStats } from "@/services/bloodwork";
import { StatusBadge } from "./StatusBadge";
import { AiBloodworkReportCard } from "@/components/ai";
import { useProfile } from "@/hooks/useProfile";
import { profileToAiContext, reportToAiContext } from "@/lib/ai/transform";
import { formatLabDate, formatRefRange } from "@/utils/bloodwork";
import type { BloodworkReportWithResults } from "@/types/bloodwork";

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

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data, error: err } = await fetchReportById(reportId);
      setReport(data);
      setError(err);
      if (data?.uploaded_file_url) {
        const { url } = await getSignedFileUrl(data.uploaded_file_url);
        setFileUrl(url);
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
    }
    load();
  }, [reportId]);

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

  const tableData = report.bloodwork_results.map((r) => ({
    id: r.id,
    marker: r.marker_name,
    category: r.category,
    result: `${r.result_value}`,
    unit: r.unit,
    reference: formatRefRange(r.reference_low, r.reference_high, r.unit),
    status: r.status,
    date: formatLabDate(report.collection_date),
  }));

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
            <Badge variant="primary">{report.bloodwork_results.length} markers</Badge>
            {(report.out_of_range_count ?? 0) > 0 && (
              <Badge variant="warning">{report.out_of_range_count} out of range</Badge>
            )}
            {report.uploaded_file_url && (
              <Badge variant="info">
                <FileText className="h-3 w-3 mr-1" />
                File attached
              </Badge>
            )}
          </div>
        </div>
        {report.notes && (
          <p className="text-sm text-muted border-t border-border/50 pt-4">{report.notes}</p>
        )}
      </Card>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Results</h2>
        {tableData.length === 0 ? (
          <Card variant="bordered" padding="lg">
            <p className="text-sm text-muted text-center py-8">
              No marker results yet.{" "}
              <Link href={`/bloodwork/entry?reportId=${report.id}`} className="text-primary hover:underline">
                Add markers manually
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
