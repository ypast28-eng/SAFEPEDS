import type { Metadata } from "next";
import { AiTimelineView } from "@/components/ai";

export const metadata: Metadata = {
  title: "AI Health Timeline",
};

export default function AiTimelinePage() {
  return <AiTimelineView />;
}
