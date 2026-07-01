import type { Metadata } from "next";
import { ArticleDetailView } from "@/components/knowledge";

export const metadata: Metadata = {
  title: "Article",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  return <ArticleDetailView slug={slug} />;
}
