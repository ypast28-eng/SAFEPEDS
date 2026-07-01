"use client";

import { cn } from "@/utils/cn";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import { AlertCircle } from "lucide-react";

interface AiDisclaimerProps {
  text?: string;
  className?: string;
}

export function AiDisclaimer({ text, className }: AiDisclaimerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-xs text-muted",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
      <p>{text ?? MEDICAL_DISCLAIMER}</p>
    </div>
  );
}
