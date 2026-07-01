import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CycleBuilder } from "@/components/cycles";

export const metadata: Metadata = {
  title: "Cycle Builder",
};

interface CycleBuilderPageProps {
  searchParams: Promise<{ id?: string }>;
}

function CycleBuilderContent({ cycleId }: { cycleId?: string }) {
  return <CycleBuilder cycleId={cycleId ?? null} />;
}

export default async function CycleBuilderPage({ searchParams }: CycleBuilderPageProps) {
  const { id } = await searchParams;

  return (
    <div>
      <PageHeader
        title="Cycle Builder"
        description="Build cycles from the compound knowledge database. Educational planning only — not medical advice."
        badge="Educational Only"
        badgeVariant="warning"
      />
      <Suspense
        fallback={<p className="text-muted text-center py-12 animate-pulse">Loading builder…</p>}
      >
        <CycleBuilderContent cycleId={id} />
      </Suspense>
    </div>
  );
}
