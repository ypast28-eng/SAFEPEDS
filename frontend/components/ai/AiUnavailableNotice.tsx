"use client";

import { Brain } from "lucide-react";
import { Card } from "@/components/ui";
import { AI_NOT_CONFIGURED_MESSAGE, getAiUnavailableMessage } from "@/lib/ai/config";

export function AiUnavailableNotice() {
  const message = getAiUnavailableMessage();
  if (!message) return null;

  return (
    <Card variant="bordered" padding="md" className="mb-6 border-secondary/30 bg-secondary/5">
      <div className="flex items-start gap-3">
        <Brain className="h-5 w-5 text-secondary shrink-0" />
        <p className="text-sm text-muted">{AI_NOT_CONFIGURED_MESSAGE}</p>
      </div>
    </Card>
  );
}

export function assertAiAvailable(): void {
  const message = getAiUnavailableMessage();
  if (message) throw new Error(message);
}
