"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button, Card, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui";

export function SettingsAccountSection() {
  const { user, signOut } = useAuth();

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your session and subscription</CardDescription>
      </CardHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Signed in as</p>
            <p className="text-xs text-muted mt-0.5">{user?.email ?? "—"}</p>
          </div>
          <Badge variant="success" dot>
            Active
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-sm font-medium text-foreground">Current Plan</p>
            <p className="text-xs text-muted mt-0.5">No active subscription</p>
          </div>
          <Badge variant="default">Free Tier</Badge>
        </div>

        <Button variant="outline" disabled className="w-full sm:w-auto">
          Upgrade Plan
        </Button>

        <Button variant="danger" onClick={() => signOut()} className="w-full sm:w-auto">
          Sign Out
        </Button>
      </div>
    </Card>
  );
}
