import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui";
import { VerifyEmailPanel } from "@/components/auth";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email = "" } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="glow-orb glow-orb-teal w-[500px] h-[500px] -top-48 left-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </div>

        <Card variant="elevated" padding="lg">
          <VerifyEmailPanel email={email} />
        </Card>
      </div>
    </div>
  );
}
