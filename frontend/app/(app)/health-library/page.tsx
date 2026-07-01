import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { HealthLibraryHub } from "@/components/health-library";

export const metadata: Metadata = {
  title: "Health Library",
};

interface PageProps {
  searchParams: Promise<{ category?: string; risk?: string; marker?: string }>;
}

export default async function HealthLibraryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div>
      <PageHeader
        title="Health Library"
        description="Educational guides on common bloodwork findings, health concerns, and monitoring considerations. Not medical advice."
        badge="Educational Only"
        badgeVariant="secondary"
      />
      <HealthLibraryHub
        initialCategory={params.category}
        initialRisk={params.risk}
        initialMarker={params.marker}
      />
    </div>
  );
}
