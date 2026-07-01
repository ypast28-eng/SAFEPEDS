"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Save } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { createReportWithFile } from "@/services/bloodwork";
import { cn } from "@/utils/cn";

const ACCEPTED = "application/pdf,image/jpeg,image/png,image/webp,image/heic";
const MAX_MB = 20;

export function UploadReportForm() {
  const router = useRouter();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState("");
  const [labName, setLabName] = useState("");
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File) {
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`);
      return;
    }
    setError(null);
    setFile(f);
    if (!reportName) {
      setReportName(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!reportName.trim()) {
      setError("Please enter a report name.");
      return;
    }

    setIsSaving(true);
    const { data, error: saveError } = await createReportWithFile(
      user.id,
      {
        report_name: reportName,
        lab_name: labName,
        collection_date: collectionDate,
        notes,
      },
      file
    );
    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    router.push(data ? `/bloodwork/reports/${data.id}` : "/bloodwork");
    router.refresh();
  }

  const isPdf = file?.type === "application/pdf";
  const isImage = file?.type.startsWith("image/");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card variant="elevated" padding="lg">
        <h3 className="text-base font-semibold text-foreground mb-4">Upload Report File</h3>
        <p className="text-sm text-muted mb-4">
          Upload a PDF or image of your pathology report. Files are stored securely in your
          private storage. You can add marker values manually after uploading.
        </p>

        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-surface-elevated/30"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              {isPdf ? (
                <FileText className="h-10 w-10 text-primary" />
              ) : isImage ? (
                <ImageIcon className="h-10 w-10 text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Choose different file
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted" />
              <p className="text-sm text-foreground">Drop file here or click to browse</p>
              <p className="text-xs text-muted">PDF, JPEG, PNG, WebP · Max {MAX_MB}MB</p>
            </div>
          )}
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="text-base font-semibold text-foreground mb-4">Report Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Report Name"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            required
          />
          <Input
            label="Laboratory Name"
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {error && (
        <div role="alert" className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/bloodwork">
          <Button type="button" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button type="submit" isLoading={isSaving} disabled={!file} className="sm:ml-auto">
          <Save className="h-4 w-4" />
          Upload & Save
        </Button>
      </div>
    </form>
  );
}
