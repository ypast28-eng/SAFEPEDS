import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = { title: "Medical Disclaimer" };

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <Card variant="elevated" padding="lg">
        <h1 className="text-2xl font-bold text-foreground mb-4">Medical Disclaimer</h1>
        <p className="text-sm text-muted leading-relaxed">{MEDICAL_DISCLAIMER}</p>
        <p className="text-sm text-muted leading-relaxed mt-4">
          PEDSAFE does not diagnose disease, prescribe medication, or recommend PED dosages.
          Always consult a qualified healthcare provider for medical decisions.
        </p>
      </Card>
    </div>
  );
}
