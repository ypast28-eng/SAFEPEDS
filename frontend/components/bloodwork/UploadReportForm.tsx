"use client";

import { Upload, Clock } from "lucide-react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export function UploadReportForm() {
  return (
    <Card variant="bordered" padding="lg" className="text-center">
      <div className="flex flex-col items-center py-10">
        <div className="h-14 w-14 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-muted" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">PDF / Image Upload</h3>
        <p className="text-sm text-muted mt-2 max-w-md">
          Automatic extraction from pathology reports is coming soon. For MVP testing, use{" "}
          <strong className="text-foreground font-medium">Manual Entry</strong> to log marker values.
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-secondary">
          <Clock className="h-4 w-4" />
          Coming soon
        </div>
        <Link href="/bloodwork/entry" className="mt-6">
          <Button variant="outline" size="sm">Switch to Manual Entry</Button>
        </Link>
      </div>
    </Card>
  );
}
