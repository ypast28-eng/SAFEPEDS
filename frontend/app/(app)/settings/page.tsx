import type { Metadata } from "next";
import { User, Bell, Shield, Palette } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui";
import { SettingsProfileSection, SettingsAccountSection } from "@/components/auth";

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
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SettingsProfileSection />
          <SettingsAccountSection />
        </div>

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
          <p className="text-xs text-muted text-center pt-2">
            Additional settings coming in later phases
          </p>
        </div>
      </div>
    </div>
  );
}
