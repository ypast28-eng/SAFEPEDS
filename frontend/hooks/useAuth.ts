"use client";

import { useAuthContext } from "@/components/auth/AuthProvider";

/** Current authenticated user and session state */
export function useAuth() {
  return useAuthContext();
}

/** Shorthand for the current user (null when signed out) */
export function useUser() {
  const { user, isLoading } = useAuthContext();
  return { user, isLoading };
}
