import type { Metadata } from "next";
import { CompareCyclesView } from "@/components/risk";

export const metadata: Metadata = {
  title: "Compare Cycles",
};

export default function RiskComparePage() {
  return <CompareCyclesView />;
}
