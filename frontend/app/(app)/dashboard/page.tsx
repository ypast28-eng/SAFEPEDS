import type { Metadata } from "next";
import { Plus, TrendingUp, AlertTriangle, Droplets } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, CardHeader, CardTitle, CardDescription, Badge, ChartPlaceholder } from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard",
};

const STAT_CARDS = [
  { label: "Last Bloodwork", value: "—", sub: "No entries yet", icon: Droplets, variant: "primary" as const },
  { label: "Active Cycle", value: "None", sub: "No cycle configured", icon: TrendingUp, variant: "secondary" as const },
  { label: "Risk Level", value: "—", sub: "Log data to assess", icon: AlertTriangle, variant: "warning" as const },
  { label: "Markers Tracked", value: "0", sub: "Add bloodwork to start", icon: TrendingUp, variant: "info" as const },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your health monitoring overview. Log bloodwork and cycles to populate this dashboard."
        badge="Phase 1 — Placeholder"
        actions={
          <Button size="sm" disabled>
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="gradient" padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted mt-1">{stat.sub}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPlaceholder
          title="Lipid Panel Trend"
          description="Total cholesterol, LDL, HDL over time"
          showPlaceholder
        />
        <ChartPlaceholder
          title="Liver Enzymes"
          description="ALT, AST, GGT markers"
          showPlaceholder
        />
      </div>

      {/* Recent activity placeholder */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest logs and updates will appear here</CardDescription>
        </CardHeader>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-4">
            <Droplets className="h-5 w-5 text-muted" />
          </div>
          <p className="text-sm text-muted">No activity yet</p>
          <p className="text-xs text-muted/60 mt-1">Start by logging your first bloodwork entry</p>
          <Badge variant="default" className="mt-4">Coming in Phase 2</Badge>
        </div>
      </Card>
    </div>
  );
}
