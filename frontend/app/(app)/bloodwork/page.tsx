import type { Metadata } from "next";
import { BloodworkDashboardView } from "@/components/bloodwork";

export const metadata: Metadata = {
  title: "Bloodwork",
};

export default function BloodworkPage() {
  return <BloodworkDashboardView />;
}
