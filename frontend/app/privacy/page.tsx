import type { Metadata } from "next";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
      <Card variant="elevated" padding="lg">
        <h1 className="text-2xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted leading-relaxed">
          Placeholder privacy policy for MVP testing. Health data you log is stored according to your
          deployment configuration (Supabase when configured, or browser localStorage in demo mode).
        </p>
      </Card>
    </div>
  );
}
