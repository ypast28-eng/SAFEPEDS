import type { Metadata } from "next";
import { User, Bell, Shield, Palette } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Settings",
};

const SETTINGS_SECTIONS = [
  { icon: User, title: "Profile", description: "Manage your account information" },
  { icon: Bell, title: "Notifications", description: "Configure email and alert preferences" },
  { icon: Shield, title: "Privacy & Security", description: "Password, 2FA, and data controls" },
  { icon: Palette, title: "Appearance", description: "Theme and display preferences" },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and privacy settings."
        badge="Phase 1 — Placeholder"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile form placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" disabled />
                <Input label="Last Name" placeholder="Doe" disabled />
              </div>
              <Input label="Email" type="email" placeholder="you@example.com" disabled />
              <Button disabled>Save Changes</Button>
            </div>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your plan and billing</CardDescription>
            </CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Current Plan</p>
                <p className="text-xs text-muted mt-0.5">No active subscription</p>
              </div>
              <Badge variant="default">Free Tier</Badge>
            </div>
            <Button variant="outline" className="mt-4" disabled>
              Upgrade Plan
            </Button>
          </Card>
        </div>

        {/* Settings nav placeholder */}
        <div className="space-y-3">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.title}
                variant="bordered"
                padding="md"
                className="flex items-center gap-3 cursor-not-allowed opacity-60"
              >
                <div className="h-9 w-9 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{section.title}</p>
                  <p className="text-xs text-muted">{section.description}</p>
                </div>
              </Card>
            );
          })}
          <p className="text-xs text-muted text-center pt-2">Full settings in Phase 2</p>
        </div>
      </div>
    </div>
  );
}
