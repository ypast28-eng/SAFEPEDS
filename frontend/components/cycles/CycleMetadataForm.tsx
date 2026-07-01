"use client";

import { Input, Textarea } from "@/components/ui";
import { CYCLE_GOAL_SUGGESTIONS } from "@/lib/constants/cycles";
import type { CycleMetadataDraft } from "@/types/cycles";

interface CycleMetadataFormProps {
  value: CycleMetadataDraft;
  onChange: (value: CycleMetadataDraft) => void;
}

export function CycleMetadataForm({ value, onChange }: CycleMetadataFormProps) {
  const set = (patch: Partial<CycleMetadataDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Cycle Name"
        placeholder="e.g. Winter Bulk 2026"
        value={value.cycle_name}
        onChange={(e) => set({ cycle_name: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Goal</label>
        <input
          list="cycle-goals"
          className="w-full h-10 rounded-lg border border-border bg-surface text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Select or type a goal"
          value={value.goal}
          onChange={(e) => set({ goal: e.target.value })}
        />
        <datalist id="cycle-goals">
          {CYCLE_GOAL_SUGGESTIONS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>
      <Input
        label="Start Date"
        type="date"
        value={value.start_date}
        onChange={(e) => set({ start_date: e.target.value })}
      />
      <Input
        label="End Date"
        type="date"
        value={value.end_date}
        onChange={(e) => set({ end_date: e.target.value })}
      />
      <div className="md:col-span-2">
        <Textarea
          label="Cycle Notes"
          placeholder="Training phase, health considerations, educational notes…"
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
