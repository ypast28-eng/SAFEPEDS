"use client";

import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

interface AuthFormProps {
  children: React.ReactNode;
  submitLabel: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
  className?: string;
}

export function AuthForm({
  children,
  submitLabel,
  onSubmit,
  isLoading = false,
  error,
  success,
  className,
}: AuthFormProps) {
  return (
    <form className={cn("space-y-4", className)} onSubmit={onSubmit} noValidate>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {success}
        </div>
      )}
      {children}
      <Button type="submit" fullWidth size="lg" isLoading={isLoading} disabled={isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
}
