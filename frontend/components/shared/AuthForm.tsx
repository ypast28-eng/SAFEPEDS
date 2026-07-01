"use client";

import { Button } from "@/components/ui";

interface AuthFormProps {
  children: React.ReactNode;
  submitLabel: string;
}

export function AuthForm({ children, submitLabel }: AuthFormProps) {
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {children}
      <Button type="submit" fullWidth size="lg">
        {submitLabel}
      </Button>
    </form>
  );
}
