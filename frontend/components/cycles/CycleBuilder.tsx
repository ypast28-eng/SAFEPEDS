"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { CompoundLibrary } from "./CompoundLibrary";
import { CycleCompoundCard } from "./CycleCompoundCard";
import { CycleMetadataForm } from "./CycleMetadataForm";
import { useAuth } from "@/hooks/useAuth";
import { fetchCycleById, saveCycle } from "@/services/cycles";
import type { CompoundWithRelations } from "@/types/compounds";
import type { CycleCompoundDraft, CycleMetadataDraft } from "@/types/cycles";
import type { DoseUnit } from "@/lib/constants/cycles";

const EMPTY_METADATA: CycleMetadataDraft = {
  cycle_name: "",
  goal: "",
  start_date: "",
  end_date: "",
  notes: "",
};

interface CycleBuilderProps {
  cycleId?: string | null;
}

export function CycleBuilder({ cycleId = null }: CycleBuilderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [metadata, setMetadata] = useState<CycleMetadataDraft>(EMPTY_METADATA);
  const [compounds, setCompounds] = useState<CycleCompoundDraft[]>([]);
  const [isLoading, setIsLoading] = useState(!!cycleId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(compounds.map((c) => c.compound_id)), [compounds]);

  useEffect(() => {
    if (!cycleId) return;

    const id = cycleId;

    async function load() {
      setIsLoading(true);
      const { data, error: err } = await fetchCycleById(id);
      if (err || !data) {
        setError(err ?? "Cycle not found");
        setIsLoading(false);
        return;
      }
      setMetadata({
        cycle_name: data.cycle_name,
        goal: data.goal ?? "",
        start_date: data.start_date ?? "",
        end_date: data.end_date ?? "",
        notes: data.notes ?? "",
      });
      setCompounds(
        data.cycle_compounds
          .filter((cc) => cc.compound)
          .map((cc) => ({
            localId: cc.id,
            compound_id: cc.compound_id,
            compound: cc.compound as CompoundWithRelations,
            weekly_dose: String(cc.weekly_dose),
            unit: cc.unit as DoseUnit,
            frequency_per_week: cc.frequency_per_week,
            duration_weeks: String(cc.duration_weeks),
            notes: cc.notes ?? "",
          }))
      );
      setIsLoading(false);
    }

    load();
  }, [cycleId]);

  const handleAddCompound = useCallback((compound: CompoundWithRelations) => {
    setCompounds((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        compound_id: compound.id,
        compound,
        weekly_dose: "",
        unit: "mg",
        frequency_per_week: 2,
        duration_weeks: "12",
        notes: "",
      },
    ]);
  }, []);

  const handleChangeCompound = useCallback(
    (localId: string, patch: Partial<CycleCompoundDraft>) => {
      setCompounds((prev) =>
        prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const handleRemoveCompound = useCallback((localId: string) => {
    setCompounds((prev) => prev.filter((c) => c.localId !== localId));
  }, []);

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("You must be signed in to save a cycle.");
      return;
    }
    if (!metadata.cycle_name.trim()) {
      setError("Please enter a cycle name.");
      return;
    }
    for (const c of compounds) {
      if (!c.weekly_dose || parseFloat(c.weekly_dose) <= 0) {
        setError(`Enter a valid weekly dose for ${c.compound.name}.`);
        return;
      }
      if (!c.duration_weeks || parseInt(c.duration_weeks, 10) <= 0) {
        setError(`Enter a valid duration for ${c.compound.name}.`);
        return;
      }
    }

    setIsSaving(true);
    const { data, error: saveError } = await saveCycle(user.id, cycleId, metadata, compounds);
    setIsSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    setSuccess("Cycle saved successfully.");
    if (!cycleId && data?.id) {
      router.replace(`/cycle-builder?id=${data.id}`);
    }
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted animate-pulse">Loading cycle…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/my-cycles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              My Cycles
            </Button>
          </Link>
          <Badge variant={cycleId ? "primary" : "secondary"}>
            {cycleId ? "Editing Cycle" : "New Cycle"}
          </Badge>
        </div>
        <Button onClick={handleSave} isLoading={isSaving} size="md">
          <Save className="h-4 w-4" />
          Save Cycle
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}

      {/* Metadata */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-secondary" />
          Cycle Details
        </h3>
        <CycleMetadataForm value={metadata} onChange={setMetadata} />
      </Card>

      {/* Builder grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <CompoundLibrary onSelect={handleAddCompound} selectedIds={selectedIds} />
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Your Stack
              <span className="text-muted font-normal ml-2">({compounds.length})</span>
            </h3>
          </div>

          {compounds.length === 0 ? (
            <Card variant="bordered" padding="lg">
              <div className="text-center py-12">
                <p className="text-sm text-muted">No compounds added yet.</p>
                <p className="text-xs text-muted/70 mt-1">
                  Search the library and add compounds to build your cycle.
                </p>
              </div>
            </Card>
          ) : (
            compounds.map((item, index) => (
              <CycleCompoundCard
                key={item.localId}
                item={item}
                index={index}
                onChange={handleChangeCompound}
                onRemove={handleRemoveCompound}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
