import type { Metadata } from "next";
import { RiskDashboardView } from "@/components/risk";

export const metadata: Metadata = {
  title: "Risk Dashboard",
};

export default function RiskPage() {
  return <RiskDashboardView />;
}
