import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <Card variant="elevated" padding="lg">
        <h1 className="text-2xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-sm text-muted leading-relaxed">
          Placeholder terms for MVP testing. This platform provides educational health monitoring tools
          only and does not constitute medical advice or a clinical service.
        </p>
      </Card>
    </div>
  );
}
