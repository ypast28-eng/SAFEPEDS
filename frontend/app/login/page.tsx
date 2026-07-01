import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Input, Card } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="glow-orb glow-orb-teal w-[400px] h-[400px] -top-32 -right-32" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your {APP_NAME} account</p>
        </div>

        <Card variant="elevated" padding="lg">
          <AuthForm submitLabel="Sign In">
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
              autoComplete="current-password"
            />
          </AuthForm>

          <p className="text-center text-sm text-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-muted/60 mt-6">
          Auth integration coming in Phase 2
        </p>
      </div>
    </div>
  );
}
