import type { Metadata } from "next";
import { AiInsightsView } from "@/components/ai";

export const metadata: Metadata = {
  title: "AI Insights",
};

export default function AiInsightsPage() {
  return <AiInsightsView />;
}
