"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { useAuthRedirectPath } from "@/components/auth/AuthProvider";
import { authService } from "@/services/auth";

interface LoginFormProps {
  initialError?: string | null;
}

export function LoginForm({ initialError = null }: LoginFormProps) {
  const router = useRouter();
  const redirectPath = useAuthRedirectPath();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (data.user && !data.user.email_confirmed_at) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push(redirectPath);
    router.refresh();
  }

  return (
    <>
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
