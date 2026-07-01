import type { Metadata } from "next";
import { KnowledgeAdminView } from "@/components/knowledge";

export const metadata: Metadata = {
  title: "Knowledge Base Admin",
};

export default function KnowledgeAdminPage() {
  return <KnowledgeAdminView />;
}
