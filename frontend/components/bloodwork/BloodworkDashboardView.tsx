"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Upload,
  TrendingUp,
  Droplets,
  FileText,
  Calendar,
  Building2,
  AlertTriangle,
  ChevronRight,
  Anchor,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Modal } from "@/components/ui";
import { useBloodworkDashboard } from "@/hooks/useBloodworkDashboard";
import { BloodworkDeleteButton } from "./BloodworkDeleteButton";
import { StatusBadge } from "./StatusBadge";
import { formatLabDate } from "@/utils/bloodwork";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { reportHasUploadedFile } from "@/lib/bloodwork/upload";

type Notice = { type: "success" | "error"; message: string };

export function BloodworkDashboardView() {
  const router = useRouter();
  const { stats, isLoading, remove } = useBloodworkDashboard();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const {
    latestReport,
    previousReports,
    totalReports,
    totalOutOfRange,
    latestCruiseReport,
    latestBlastReport,
    hasCruiseBaseline,
  } = stats;

  function openDeleteDialog(reportId: string) {
    setNotice(null);
    setDeleteId(reportId);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    setNotice(null);

    const { error } = await remove(deleteId);

    setIsDeleting(false);

    if (error) {
      console.error("[bloodwork] Failed to delete entry", { reportId: deleteId, error });
      setNotice({ type: "error", message: error });
      return;
    }

    setDeleteId(null);
    setNotice({ type: "success", message: "Bloodwork entry deleted." });
  }

  return (
    <div>
      <PageHeader
        title="Bloodwork"
        description="Track, store, and visualize laboratory results over time. Educational display only — not medical advice."
        badge="Data Tracking"
        badgeVariant="primary"
        actions={
          <>
            <Link href="/bloodwork/trends">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4" />
                Trends
              </Button>
            </Link>
            <Link href="/bloodwork/entry">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Results
              </Button>
            </Link>
          </>
        }
      />

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={cn(
            "mb-6 rounded-lg border px-4 py-3 text-sm flex items-center gap-2",
            notice.type === "success"
              ? "border-primary/30 bg-primary/10 text-foreground"
              : "border-accent/30 bg-accent/10 text-accent"
          )}
        >
          {notice.type === "success" && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
          {notice.message}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Reports", value: isLoading ? "…" : String(totalReports), icon: FileText },
          {
            label: "Latest Collection",
            value: isLoading ? "…" : formatLabDate(latestReport?.collection_date ?? null),
            icon: Calendar,
          },
          {
            label: "Out of Range",
            value: isLoading ? "…" : String(totalOutOfRange),
            icon: AlertTriangle,
            highlight: totalOutOfRange > 0,
          },
          {
            label: "Latest Lab",
            value: isLoading ? "…" : latestReport?.lab_name || "—",
            icon: Building2,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="gradient" padding="md" className="animate-fade-slide-up">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
                  <p
                    className={cn(
                      "text-xl font-bold mt-1 truncate",
                      stat.highlight ? "text-secondary" : "text-foreground"
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Cruise / Blast baseline */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Anchor className="h-4 w-4 text-primary" />
          Cruise vs Blast Tracking
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="gradient" padding="md">
            <p className="text-xs text-muted uppercase tracking-wider">Latest Cruise</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {isLoading ? "…" : formatLabDate(latestCruiseReport?.collection_date ?? null)}
            </p>
            <p className="text-xs text-muted mt-1">Maintenance / baseline phase</p>
          </Card>
          <Card variant="gradient" padding="md">
            <p className="text-xs text-muted uppercase tracking-wider">Latest Blast</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {isLoading ? "…" : formatLabDate(latestBlastReport?.collection_date ?? null)}
            </p>
            <p className="text-xs text-muted mt-1">Higher-dose cycle phase</p>
          </Card>
          <Card variant="gradient" padding="md">
            <p className="text-xs text-muted uppercase tracking-wider">Personal Baseline</p>
            {isLoading ? (
              <p className="text-lg font-bold text-foreground mt-1">…</p>
            ) : hasCruiseBaseline ? (
              <>
                <p className="text-lg font-bold text-primary mt-1">Baseline established</p>
                <p className="text-xs text-muted mt-1">
                  {latestCruiseReport?.report_name ?? "Cruise bloodwork on file"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Add cruise bloodwork to establish your personal baseline.
                </p>
                <Link href="/bloodwork/entry" className="inline-block mt-3">
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4" />
                    Add cruise bloodwork
                  </Button>
                </Link>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* Latest report */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          Latest Report
        </h2>

        {isLoading && (
          <Card variant="bordered" padding="lg" className="animate-pulse h-40" />
        )}

        {!isLoading && !latestReport && (
          <Card variant="bordered" padding="lg">
            <div className="text-center py-12">
              <Droplets className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted mb-4">No bloodwork reports yet.</p>
              <Link href="/bloodwork/entry">
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Your First Report
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {!isLoading && latestReport && (
          <Card variant="elevated" hover padding="lg" className="group">
            <div className="flex items-start justify-between gap-4">
              <button
                type="button"
                className="flex-1 min-w-0 text-left cursor-pointer"
                onClick={() => router.push(`/bloodwork/reports/${latestReport.id}`)}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {latestReport.report_name}
                  </h3>
                  <Badge variant="primary">Latest</Badge>
                  {reportHasUploadedFile(latestReport) && (
                    <Badge variant="info" size="sm">
                      <Upload className="h-3 w-3 mr-1" />
                      File attached
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatLabDate(latestReport.collection_date)}
                  </span>
                  {latestReport.lab_name && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {latestReport.lab_name}
                    </span>
                  )}
                  <span>{latestReport.bloodwork_results.length} markers</span>
                  {(latestReport.out_of_range_count ?? 0) > 0 && (
                    <span className="text-secondary">
                      {latestReport.out_of_range_count} outside reference range
                    </span>
                  )}
                </div>
                {latestReport.bloodwork_results.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {latestReport.bloodwork_results.slice(0, 6).map((r) => (
                      <div
                        key={r.id}
                        className="text-xs px-2.5 py-1 rounded-md bg-surface border border-border/50 flex items-center gap-2"
                      >
                        <span className="text-muted">{r.marker_name}</span>
                        <span className="font-medium text-foreground">
                          {r.result_value} {r.unit}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                    {latestReport.bloodwork_results.length > 6 && (
                      <span className="text-xs text-muted self-center">
                        +{latestReport.bloodwork_results.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </button>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <BloodworkDeleteButton
                  reportId={latestReport.id}
                  isDeleting={isDeleting}
                  deletingId={deleteId}
                  onDeleteRequest={openDeleteDialog}
                />
                <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Previous reports */}
      {previousReports.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-4">Previous Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousReports.map((report, index) => (
              <Card
                key={report.id}
                variant="gradient"
                hover
                padding="md"
                className="group animate-fade-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/bloodwork/reports/${report.id}`} className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {report.report_name}
                    </h3>
                    <p className="text-xs text-muted mt-1">
                      {formatLabDate(report.collection_date)}
                      {report.lab_name ? ` · ${report.lab_name}` : ""}
                      {(report.phase === "cruise" || report.phase === "blast") && (
                        <span className="ml-1">· {report.phase === "cruise" ? "Cruise" : "Blast"}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {report.bloodwork_results.length} markers
                      {(report.out_of_range_count ?? 0) > 0 && (
                        <span className="text-secondary ml-1">
                          · {report.out_of_range_count} out of range
                        </span>
                      )}
                    </p>
                  </Link>
                  <BloodworkDeleteButton
                    reportId={report.id}
                    isDeleting={isDeleting}
                    deletingId={deleteId}
                    onDeleteRequest={openDeleteDialog}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={!!deleteId}
        onClose={() => {
          if (!isDeleting) setDeleteId(null);
        }}
        title="Delete bloodwork?"
        description="Are you sure you want to delete this bloodwork entry? This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={isDeleting}
              isLoading={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      />
    </div>
  );
}
