import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui";
import { TrendDashboard } from "@/components/bloodwork";

export const metadata: Metadata = {
  title: "Bloodwork Trends",
};

export default function BloodworkTrendsPage() {
  return (
    <div>
      <PageHeader
        title="Trend Dashboard"
        description="Visualize how your markers change over time. Based on your logged data only — not medical interpretation."
        badge="Trend Tracking"
        actions={
          <Link href="/bloodwork">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        }
      />
      <TrendDashboard />
    </div>
  );
}
