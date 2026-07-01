"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { tryCreateClient } from "@/lib/supabase/client";
import { isLocalDemoMode, LOCAL_USER_ID } from "@/lib/runtime/config";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/routes";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLocalDemo: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_DEMO_USER = {
  id: LOCAL_USER_ID,
  email: "demo@local.test",
  app_metadata: {},
  user_metadata: { demo: true },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => tryCreateClient(), []);
  const isLocalDemo = isLocalDemoMode();
  const [user, setUser] = useState<User | null>(isLocalDemo ? LOCAL_DEMO_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isLocalDemo);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      if (isLocalDemo) {
        setUser(LOCAL_DEMO_USER);
        setSession(null);
      }
      setIsLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
  }, [supabase, isLocalDemo]);

  useEffect(() => {
    if (isLocalDemo) {
      setUser(LOCAL_DEMO_USER);
      setIsLoading(false);
      return;
    }
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    refreshSession().finally(() => setIsLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [supabase, router, refreshSession, isLocalDemo]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(isLocalDemo ? LOCAL_DEMO_USER : null);
    if (!isLocalDemo) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }, [supabase, router, isLocalDemo]);

  const value = useMemo(
    () => ({ user, session, isLoading, isLocalDemo, signOut, refreshSession }),
    [user, session, isLoading, isLocalDemo, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

/** Returns the redirect path after successful login */
export function useAuthRedirectPath(): string {
  if (typeof window === "undefined") return DEFAULT_LOGIN_REDIRECT;
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return DEFAULT_LOGIN_REDIRECT;
}
