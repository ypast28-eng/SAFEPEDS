"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { authService } from "@/services/auth";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    const { error: resetError } = await authService.resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(
      "If an account exists for that email, you will receive a password reset link shortly."
    );
    setIsLoading(false);
  }

  return (
    <>
      <AuthForm
        submitLabel="Send Reset Link"
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        success={success}
      >
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </AuthForm>

      <p className="text-center text-sm text-muted mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}
