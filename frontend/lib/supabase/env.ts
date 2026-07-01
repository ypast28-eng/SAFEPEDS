/**
 * Supabase environment helpers.
 * Optional getters avoid crashes when env vars are missing (Vercel MVP / CI).
 */

import { config } from "@/lib/config";

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(config.supabase.url && config.supabase.anonKey);
}

export function getSupabaseUrl(): string {
  if (!config.supabase.url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see .env.example)."
    );
  }
  return config.supabase.url;
}

export function getSupabaseAnonKey(): string {
  if (!config.supabase.anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to .env.local (see .env.example)."
    );
  }
  return config.supabase.anonKey;
}
