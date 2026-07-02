"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { redirectAfterAuth } from "@/lib/auth/redirect";

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (!email || !password) {
        setError("Please fill in all required fields.");
        return;
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { data, error: signUpError } = await authService.signUp(email, password);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user && !data.session) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      await refreshSession();
      redirectAfterAuth("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthForm
      submitLabel="Create Account"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
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
        autoComplete="new-password"
        hint={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
        required
      />
      <Input
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />
    </AuthForm>
  );
}
