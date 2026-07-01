import type { Metadata } from "next";
import { WhatIfView } from "@/components/risk";

export const metadata: Metadata = {
  title: "What-If Analysis",
};

export default function RiskWhatIfPage() {
  return <WhatIfView />;
}
