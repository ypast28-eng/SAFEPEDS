"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";
import { Card } from "@/components/ui";
import { fetchAiReportConfig } from "@/services/ai-cycle-report";

export function AiUnavailableNotice() {
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAiReportConfig().then(({ configured, setupInstructions }) => {
      setSetupMessage(configured ? null : setupInstructions);
    });
  }, []);

  if (!setupMessage) return null;

  return (
    <Card variant="bordered" padding="md" className="mb-6 border-secondary/30 bg-secondary/5">
      <div className="flex items-start gap-3">
        <Brain className="h-5 w-5 text-secondary shrink-0" />
        <p className="text-sm text-muted whitespace-pre-line">{setupMessage}</p>
      </div>
    </Card>
  );
}

export function assertAiAvailable(): void {
  // Availability is checked per-request via /api/ai/config and API responses.
}
