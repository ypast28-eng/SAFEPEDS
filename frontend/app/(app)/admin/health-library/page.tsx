import type { Metadata } from "next";
import { HealthAdminView } from "@/components/health-library";

export const metadata: Metadata = {
  title: "Health Library Admin",
};

export default function HealthLibraryAdminPage() {
  return <HealthAdminView />;
}
