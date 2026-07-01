import type { Metadata } from "next";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge, Table, ChartPlaceholder } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bloodwork",
};

const PLACEHOLDER_LABS = [
  { date: "—", panel: "—", markers: "—", status: "No entries" },
];

export default function BloodworkPage() {
  return (
    <div>
      <PageHeader
        title="Bloodwork"
        description="Log and visualize lab results over time. Track lipids, liver enzymes, hormones, and more."
        badge="Phase 1 — Placeholder"
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4" />
              Log Results
            </Button>
          </>
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Entries", value: "0" },
          { label: "Last Test Date", value: "—" },
          { label: "Markers Out of Range", value: "—" },
        ].map((stat) => (
          <Card key={stat.label} variant="gradient" padding="md">
            <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-8">
        <ChartPlaceholder
          title="Marker Trends"
          description="Select a marker to visualize changes over time"
          type="area"
          showPlaceholder
        />
      </div>

      {/* Lab history table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Lab History</h2>
          <Badge variant="default">Phase 2</Badge>
        </div>
        <Table
          columns={[
            { key: "date", header: "Date" },
            { key: "panel", header: "Panel" },
            { key: "markers", header: "Markers Logged" },
            { key: "status", header: "Status" },
          ]}
          data={PLACEHOLDER_LABS}
          emptyMessage="No bloodwork entries yet. Log your first results to get started."
        />
      </div>
    </div>
  );
}
