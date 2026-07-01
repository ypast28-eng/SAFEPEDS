"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui";
import { authService } from "@/services/auth";

interface VerifyEmailPanelProps {
  email: string;
}

export function VerifyEmailPanel({ email }: VerifyEmailPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) {
      setError("No email address provided.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const { error: resendError } = await authService.resendVerificationEmail(email);

    if (resendError) {
      setError(resendError.message);
    } else {
      setMessage("Verification email sent. Please check your inbox.");
    }

    setIsLoading(false);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
        <Mail className="h-7 w-7 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
      <p className="text-sm text-muted leading-relaxed mb-2">
        We sent a confirmation link to:
      </p>
      {email ? (
        <p className="text-sm font-medium text-foreground mb-6">{email}</p>
      ) : (
        <p className="text-sm text-muted mb-6">your email address</p>
      )}
      <p className="text-sm text-muted leading-relaxed mb-8">
        Click the link in the email to activate your account. You can close this page
        after verifying.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent text-left"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary text-left"
        >
          {message}
        </div>
      )}

      <Button
        variant="outline"
        fullWidth
        onClick={handleResend}
        isLoading={isLoading}
        disabled={!email || isLoading}
      >
        Resend verification email
      </Button>

      <p className="text-sm text-muted mt-6">
        <Link href="/login" className="text-primary hover:underline font-medium">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
