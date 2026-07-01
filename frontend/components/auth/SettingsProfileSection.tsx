"use client";

import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { useUser } from "@/hooks/useAuth";

function formatValue(value: string | number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined || value === "") return "—";
  return `${value}${suffix}`;
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SettingsProfileSection() {
  const { user } = useUser();
  const { profile, isLoading, error } = useProfile();

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Account data stored in Supabase. Profile editing comes in a later phase.
        </CardDescription>
      </CardHeader>

      {isLoading && <p className="text-sm text-muted">Loading profile…</p>}

      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {profile?.email ?? user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Age</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatValue(profile?.age)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Sex</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatLabel(profile?.sex)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Height</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatValue(profile?.height, " cm")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Weight</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatValue(profile?.weight, " kg")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Body Fat</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatValue(profile?.body_fat, "%")}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">Training Experience</dt>
            <dd className="font-medium text-foreground mt-0.5">
              {formatLabel(profile?.training_experience)}
            </dd>
          </div>
        </dl>
      )}

      <Badge variant="default" className="mt-4">
        Profile editing — Phase 3
      </Badge>
    </Card>
  );
}
