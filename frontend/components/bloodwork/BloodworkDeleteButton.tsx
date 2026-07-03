"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export function BloodworkDeleteButton({
  reportId,
  isDeleting,
  deletingId,
  onDeleteRequest,
}: {
  reportId: string;
  isDeleting: boolean;
  deletingId: string | null;
  onDeleteRequest: (id: string) => void;
}) {
  const inProgress = isDeleting && deletingId === reportId;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onDeleteRequest(reportId);
      }}
      disabled={isDeleting}
      isLoading={inProgress}
      aria-label="Delete bloodwork entry"
    >
      <Trash2 className="h-4 w-4" />
      {inProgress ? "Deleting…" : "Delete"}
    </Button>
  );
}
