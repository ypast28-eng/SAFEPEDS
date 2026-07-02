"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { isLocalDemoMode, isBackendConfigured } from "@/lib/runtime/config";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

/** True when the Next.js bloodwork extract route responds (any status except 404). */
async function checkBloodworkExtractApiReachable(): Promise<boolean> {
  try {
    const res = await fetch("/api/bloodwork/extract", {
      method: "GET",
      cache: "no-store",
    });
    if (res.status === 404) return false;
    const json = (await res.json()) as { configured?: boolean };
    return typeof json.configured === "boolean";
  } catch {
    return false;
  }
}

export function SetupWarningBanner() {
  const supabaseOk = isSupabaseEnvConfigured();
  const backendOk = isBackendConfigured();
  const localDemo = isLocalDemoMode();
  const [nextApiReachable, setNextApiReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseOk) return;
    checkBloodworkExtractApiReachable().then(setNextApiReachable);
  }, [supabaseOk]);

  // Supabase + FastAPI backend, or Supabase + deployed Next.js extract route — no banner.
  if (supabaseOk && (backendOk || nextApiReachable === true)) return null;

  // Wait for probe before showing backend-only warning (prevents flash on Vercel).
  if (supabaseOk && !backendOk && nextApiReachable === null) return null;

  return (
    <div className="mb-6 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-medium text-foreground">MVP demo mode</p>
          {!supabaseOk && (
            <p className="text-muted">
              Supabase is not configured. Cycles and bloodwork are saved to your browser (localStorage).
              Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel to enable auth and cloud sync.
            </p>
          )}
          {supabaseOk && !backendOk && nextApiReachable === false && (
            <p className="text-muted">
              API backend is not reachable. Risk scores use local placeholder rules; Knowledge Base and Health Library use bundled articles.
            </p>
          )}
          {localDemo && (
            <p className="text-muted">
              You are signed in as a local demo user.{" "}
              <Link href="/login" className="text-secondary hover:underline">Configure Supabase</Link> for real accounts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
