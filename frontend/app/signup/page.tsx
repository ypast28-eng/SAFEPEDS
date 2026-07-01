import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Input, Card } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { APP_NAME } from "@/lib/constants";

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
          <AuthForm submitLabel="Create Account">
            <Input label="Full Name" type="text" placeholder="John Doe" autoComplete="name" />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimum 8 characters"
            />
          </AuthForm>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-muted/60 mt-6">
          By signing up, you agree to our Terms of Service. Auth integration coming in Phase 2.
        </p>
      </div>
    </div>
  );
}
