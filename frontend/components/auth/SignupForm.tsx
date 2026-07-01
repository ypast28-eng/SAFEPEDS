"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { authService } from "@/services/auth";

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const { data, error: signUpError } = await authService.signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Email confirmation required — no session until verified
    if (data.user && !data.session) {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
