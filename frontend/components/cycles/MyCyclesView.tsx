"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FlaskConical,
  Pencil,
  Trash2,
  Copy,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Modal } from "@/components/ui";
import { useUserCycles } from "@/hooks/useUserCycles";
import { cn } from "@/utils/cn";

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MyCyclesView() {
  const router = useRouter();
  const { cycles, isLoading, error, remove, duplicate } = useUserCycles();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleteId) return;
    setIsDeleting(true);
    await remove(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    const { data, error: err } = await duplicate(id);
    setDuplicatingId(null);
    if (!err && data?.id) {
      router.push(`/cycle-builder?id=${data.id}`);
    }
  }

  return (
    <div>
      <PageHeader
        title="My Cycles"
        description="View, edit, duplicate, or delete your saved cycles. All data is stored securely in your account."
        badge="Educational Only"
        badgeVariant="warning"
        actions={
          <Link href="/cycle-builder">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Cycle
            </Button>
          </Link>
        }
      />

      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="gradient" padding="lg" className="animate-pulse h-48" />
          ))}
        </div>
      )}

      {!isLoading && cycles.length === 0 && (
        <Card variant="bordered" padding="lg">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
              <FlaskConical className="h-7 w-7 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No cycles yet</h3>
            <p className="text-sm text-muted max-w-md mb-6">
              Build your first cycle using compounds from the knowledge database.
            </p>
            <Link href="/cycle-builder">
              <Button>
                <Plus className="h-4 w-4" />
                Create Your First Cycle
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {!isLoading && cycles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cycles.map((cycle, index) => (
            <Card
              key={cycle.id}
              variant="gradient"
              hover
              padding="lg"
              className={cn(
                "group flex flex-col transition-all duration-300 animate-fade-slide-up"
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {cycle.cycle_name}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                {cycle.goal && (
                  <Badge variant="secondary" className="mb-3">
                    {cycle.goal}
                  </Badge>
                )}

                <div className="space-y-1.5 text-xs text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {formatDate(cycle.start_date)} → {formatDate(cycle.end_date)}
                    </span>
                  </div>
                  <p>{cycle.compound_count} compound{cycle.compound_count !== 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                <Link href={`/cycle-builder?id=${cycle.id}`} className="flex-1 min-w-[80px]">
                  <Button variant="outline" size="sm" fullWidth>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(cycle.id)}
                  isLoading={duplicatingId === cycle.id}
                  className="flex-1 min-w-[80px]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteId(cycle.id);
                    setDeleteName(cycle.cycle_name);
                  }}
                  className="text-muted hover:text-accent"
                  aria-label="Delete cycle"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete cycle?"
        description={`"${deleteName}" and all its compounds will be permanently removed.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
