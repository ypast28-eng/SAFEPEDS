"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { tryCreateClient } from "@/lib/supabase/client";
import { isLocalDemoMode } from "@/lib/runtime/config";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, ProfileUpdate } from "@/types/database";

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: string | null }>;
}

/** Fetch and update the signed-in user's profile row */
export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const supabase = useMemo(() => tryCreateClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (isLocalDemoMode() || !supabase) {
      setProfile({
        id: user.id,
        email: user.email ?? null,
        full_name: "Demo User",
        is_admin: false,
        age: null,
        sex: null,
        height: null,
        weight: null,
        body_fat: null,
        training_experience: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setProfile(null);
    } else {
      setProfile(data as Profile | null);
    }

    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      if (!user) return { error: "Not authenticated" };
      if (isLocalDemoMode() || !supabase) {
        setProfile((p) => (p ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
        return { error: null };
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        return { error: updateError.message };
      }

      await refreshProfile();
      return { error: null };
    },
    [supabase, user, refreshProfile]
  );

  return { profile, isLoading, error, refreshProfile, updateProfile };
}
