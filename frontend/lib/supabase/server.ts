import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseEnvConfigured, getSupabaseAnonKey, getSupabaseUrl } from "./env";

/** Server Supabase client — use in Server Components, Route Handlers, Server Actions */
export async function createClient() {
  if (!isSupabaseEnvConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — safe to ignore when
          // middleware is refreshing the session.
        }
      },
    },
  });
}
