"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { isLocalDemoMode, isBackendConfigured } from "@/lib/runtime/config";
import { isSupabaseEnvConfigured } from "@/lib/supabase/env";

async function checkBloodworkExtractApiReachable(): Promise<boolean> {
  try {
    const res = await fetch("/api/bloodwork/extract", { method: "GET" });
    return res.ok;
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

  if (supabaseOk && backendOk) return null;
  if (supabaseOk && nextApiReachable) return null;

  // Avoid flashing the backend warning while we probe the Next.js API route.
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
