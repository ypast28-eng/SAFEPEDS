import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui";
import { ForgotPasswordForm } from "@/components/auth";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="glow-orb glow-orb-teal w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-muted text-sm mt-1">
            Enter your {APP_NAME} account email
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <ForgotPasswordForm />
        </Card>
      </div>
    </div>
  );
}
