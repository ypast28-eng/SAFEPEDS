import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { CompoundKnowledgeExplorer } from "@/components/cycles/CompoundKnowledgeExplorer";

export const metadata: Metadata = {
  title: "Knowledge Base",
};

export default function KnowledgeBasePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Browse the compound knowledge database. All data is loaded from Supabase — educational content only."
        badge="Database-Driven"
        badgeVariant="primary"
      />
      <CompoundKnowledgeExplorer />
    </div>
  );
}
