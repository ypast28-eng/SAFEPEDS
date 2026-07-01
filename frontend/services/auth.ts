import { isSupabaseEnvConfigured } from "@/lib/supabase/env";
import { tryCreateClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

function getRedirectUrl(path: string): string {
  const base = config.app.url.replace(/\/$/, "");
  return `${base}${path}`;
}

function requireClient() {
  const client = tryCreateClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable authentication."
    );
  }
  return client;
}

/** Client-side Supabase auth operations */
export const authService = {
  isConfigured: () => isSupabaseEnvConfigured(),

  async signInWithPassword(email: string, password: string) {
    return requireClient().auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    return requireClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl("/auth/callback"),
      },
    });
  },

  async signOut() {
    const client = tryCreateClient();
    if (!client) return { error: null };
    return client.auth.signOut();
  },

  async resetPassword(email: string) {
    return requireClient().auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl("/reset-password"),
    });
  },

  async resendVerificationEmail(email: string) {
    return requireClient().auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getRedirectUrl("/auth/callback"),
      },
    });
  },

  async updatePassword(password: string) {
    return requireClient().auth.updateUser({ password });
  },

  async getSession() {
    const client = tryCreateClient();
    if (!client) return { data: { session: null }, error: null };
    return client.auth.getSession();
  },
};
