import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { KnowledgeBaseHub } from "@/components/knowledge";

export const metadata: Metadata = {
  title: "Knowledge Base",
};

export default function KnowledgeBasePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Scientific educational articles on compounds, bloodwork, and health monitoring. Primary source for AI explanations."
        badge="RAG-Powered"
        badgeVariant="primary"
      />
      <KnowledgeBaseHub />
    </div>
  );
}
