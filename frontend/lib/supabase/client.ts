import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseEnvConfigured, getSupabaseAnonKey, getSupabaseUrl } from "./env";

let client: SupabaseClient | null = null;

/** Browser Supabase client — use in Client Components when Supabase is configured */
export function createClient(): SupabaseClient {
  if (!isSupabaseEnvConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, or use local demo mode."
    );
  }
  if (!client) {
    client = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return client;
}

export function tryCreateClient(): SupabaseClient | null {
  if (!isSupabaseEnvConfigured()) return null;
  return createClient();
}
