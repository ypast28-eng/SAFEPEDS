/** Runtime feature detection for MVP / demo mode */

import { config } from "@/lib/config";

export const LOCAL_USER_ID = "local-demo-user";

export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.anonKey);
}

export function isBackendConfigured(): boolean {
  const url = config.api.baseUrl;
  if (!url) return false;
  // Vercel frontend-only deploys often have no API — treat localhost as optional dev backend
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && url.includes("localhost")) {
      return false;
    }
  }
  return true;
}

export function isAiConfigured(): boolean {
  return isBackendConfigured();
}

export function isLocalDemoMode(): boolean {
  return !isSupabaseConfigured();
}
