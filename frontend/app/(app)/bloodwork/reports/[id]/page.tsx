import type { Metadata } from "next";
import { ReportDetailView } from "@/components/bloodwork";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bloodwork Report",
};

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function BloodworkReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  return <ReportDetailView reportId={id} />;
}
