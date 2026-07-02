"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { useAuthRedirectPath } from "@/components/auth/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { redirectAfterAuth } from "@/lib/auth/redirect";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { AlertTriangle } from "lucide-react";

interface LoginFormProps {
  initialError?: string | null;
}

export function LoginForm({ initialError = null }: LoginFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const redirectPath = useAuthRedirectPath();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const supabaseConfigured = isSupabaseEnvConfigured();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase is not configured. Use demo mode or add environment variables.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        setError("Please enter your email and password.");
        return;
      }

      const { data, error: signInError } = await authService.signInWithPassword(
        email,
        password
      );

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(signInError.message);
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      await refreshSession();
      redirectAfterAuth(redirectPath);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {!supabaseConfigured && (
        <div className="mb-4 rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-sm">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Supabase not configured</p>
              <p className="text-muted mt-1">
                Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.
                You can still test the app in demo mode.
              </p>
              <Link href="/dashboard" className="inline-block mt-3">
                <Button type="button" size="sm" variant="secondary">Continue in Demo Mode</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <AuthForm submitLabel="Sign In" onSubmit={handleSubmit} isLoading={isLoading} error={error}>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </AuthForm>

      <p className="text-right text-sm mt-3">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </p>
    </>
  );
}
