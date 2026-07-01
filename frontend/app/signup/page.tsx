import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Card } from "@/components/ui";
import { SignupForm } from "@/components/auth";
import { APP_NAME, MEDICAL_DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="glow-orb glow-orb-gold w-[400px] h-[400px] -bottom-32 -left-32" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted text-sm mt-1">Start monitoring your health with {APP_NAME}</p>
        </div>

        <Card variant="elevated" padding="lg">
          <SignupForm />

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-muted/60 mt-6">{MEDICAL_DISCLAIMER}</p>
      </div>
    </div>
  );
}
