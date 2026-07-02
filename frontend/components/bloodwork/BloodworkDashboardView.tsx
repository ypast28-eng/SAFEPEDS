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
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Modal } from "@/components/ui";
import { useBloodworkDashboard } from "@/hooks/useBloodworkDashboard";
import { StatusBadge } from "./StatusBadge";
import { formatLabDate } from "@/utils/bloodwork";
import { useState } from "react";
import { cn } from "@/utils/cn";
import { reportHasUploadedFile } from "@/lib/bloodwork/upload";

export function BloodworkDashboardView() {
  const router = useRouter();
  const { stats, isLoading, remove } = useBloodworkDashboard();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { latestReport, previousReports, totalReports, totalOutOfRange } = stats;

  async function confirmDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await remove(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
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
          <Card variant="elevated" hover padding="lg" className="group cursor-pointer" onClick={() => router.push(`/bloodwork/reports/${latestReport.id}`)}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
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
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary transition-colors shrink-0" />
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
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteId(report.id);
                      setDeleteName(report.report_name);
                    }}
                    className="text-muted hover:text-accent p-1"
                    aria-label="Delete report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete report?"
        description={`"${deleteName}" and all associated results will be permanently removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>Delete</Button>
          </>
        }
      />
    </div>
  );
}
