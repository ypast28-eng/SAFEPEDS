import type { Metadata } from "next";
import { TopicDetailView } from "@/components/health-library";

export const metadata: Metadata = {
  title: "Health Topic",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HealthTopicPage({ params }: PageProps) {
  const { slug } = await params;
  return <TopicDetailView slug={slug} />;
}
