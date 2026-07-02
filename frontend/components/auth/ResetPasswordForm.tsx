"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { AuthForm } from "@/components/shared/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import { redirectAfterAuth } from "@/lib/auth/redirect";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const { refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { error: updateError } = await authService.updatePassword(password);

      if (updateError) {
        setError(updateError.message);
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
      submitLabel="Update Password"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      <Input
        label="New Password"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        hint={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
        required
      />
      <Input
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        required
      />
    </AuthForm>
  );
}
