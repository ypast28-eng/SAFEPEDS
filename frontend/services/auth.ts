/**
 * Auth service placeholder — Supabase Auth integration in Phase 2
 */
export const authService = {
  signIn: async (email: string, password: string) => {
    void email;
    void password;
    return { success: false, message: "Auth not yet implemented" };
  },
  signUp: async (email: string, password: string) => {
    void email;
    void password;
    return { success: false, message: "Auth not yet implemented" };
  },
  signOut: async () => {
    // Phase 2: Supabase signOut
    return { success: true };
  },
  getSession: async () => {
    // Phase 2: Supabase getSession
    return null;
  },
};
