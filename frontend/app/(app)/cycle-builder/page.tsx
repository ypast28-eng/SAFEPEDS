import type { Metadata } from "next";
import { Plus, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Table } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cycle Builder",
};

const PLACEHOLDER_COMPOUNDS = [
  { name: "—", dosage: "—", frequency: "—", duration: "—", status: "—" },
];

export default function CycleBuilderPage() {
  return (
    <div>
      <PageHeader
        title="Cycle Builder"
        description="Plan and track compound cycles with educational risk context. Not a prescription tool."
        badge="Educational Only"
        badgeVariant="warning"
        actions={
          <Button size="sm" disabled>
            <Plus className="h-4 w-4" />
            New Cycle
          </Button>
        }
      />

      {/* Empty state */}
      <Card variant="bordered" className="mb-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
            <FlaskConical className="h-7 w-7 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Active Cycle</h3>
          <p className="text-sm text-muted max-w-md">
            Create a cycle to track compounds, dosages, and duration. Each compound will include
            educational risk information — not medical recommendations.
          </p>
          <Button className="mt-6" disabled>
            <Plus className="h-4 w-4" />
            Create Your First Cycle
          </Button>
          <Badge variant="default" className="mt-4">Phase 2</Badge>
        </div>
      </Card>

      {/* Compound table placeholder */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Compound Stack</h2>
        <Table
          columns={[
            { key: "name", header: "Compound" },
            { key: "dosage", header: "Dosage" },
            { key: "frequency", header: "Frequency" },
            { key: "duration", header: "Duration" },
            { key: "status", header: "Status" },
          ]}
          data={PLACEHOLDER_COMPOUNDS}
          emptyMessage="Add compounds to your cycle to see them here"
        />
      </div>
    </div>
  );
}
