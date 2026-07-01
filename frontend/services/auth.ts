import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

function getRedirectUrl(path: string): string {
  const base = config.app.url.replace(/\/$/, "");
  return `${base}${path}`;
}

/** Client-side Supabase auth operations */
export const authService = {
  async signInWithPassword(email: string, password: string) {
    const supabase = createClient();
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signUp(email: string, password: string) {
    const supabase = createClient();
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl("/auth/callback"),
      },
    });
  },

  async signOut() {
    const supabase = createClient();
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const supabase = createClient();
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl("/reset-password"),
    });
  },

  async resendVerificationEmail(email: string) {
    const supabase = createClient();
    return supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getRedirectUrl("/auth/callback"),
      },
    });
  },

  async updatePassword(password: string) {
    const supabase = createClient();
    return supabase.auth.updateUser({ password });
  },

  async getSession() {
    const supabase = createClient();
    return supabase.auth.getSession();
  },
};
