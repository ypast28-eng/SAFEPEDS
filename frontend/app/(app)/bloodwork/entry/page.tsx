import type { Metadata } from "next";
import { Suspense } from "react";
import { BloodworkEntryView } from "@/components/bloodwork";

export const metadata: Metadata = {
  title: "Add Bloodwork",
};

export default function BloodworkEntryPage() {
  return (
    <Suspense fallback={<p className="text-muted text-center py-12 animate-pulse">Loading…</p>}>
      <BloodworkEntryView />
    </Suspense>
  );
}
