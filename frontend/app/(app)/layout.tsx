import { AppShell } from "@/components/layout";

/** Shared layout for all authenticated app pages */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
