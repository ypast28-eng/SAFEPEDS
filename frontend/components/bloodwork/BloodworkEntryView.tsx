"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PenLine, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui";
import { ManualEntryForm } from "./ManualEntryForm";
import { UploadReportForm } from "./UploadReportForm";
import { cn } from "@/utils/cn";

type Tab = "manual" | "upload";

export function BloodworkEntryView() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [tab, setTab] = useState<Tab>("manual");

  if (reportId) {
    return (
      <div>
        <PageHeader
          title="Add Markers"
          description="Add laboratory results to your existing report."
          badge="Manual Entry"
        />
        <ManualEntryForm existingReportId={reportId} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Add Bloodwork"
        description="Enter results manually or upload a PDF/image of your pathology report."
        badge="Educational Tracking"
        actions={
          <Link href="/bloodwork">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        }
      />

      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-surface border border-border/50 w-fit">
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            tab === "manual"
              ? "bg-primary/15 text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          <PenLine className="h-4 w-4" />
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            tab === "upload"
              ? "bg-primary/15 text-primary shadow-sm"
              : "text-muted hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
      </div>

      {tab === "manual" ? <ManualEntryForm /> : <UploadReportForm />}
    </div>
  );
}
