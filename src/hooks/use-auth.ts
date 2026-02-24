"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { User as AppUser } from "@/lib/types";

interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

interface AuthState {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = "/login", requireAuth = true } = options;
  const [state, setState] = useState<AuthState>({
    user: null,
    appUser: null,
    loading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          if (requireAuth) {
            router.push(redirectTo);
          }
          setState({ user: null, appUser: null, loading: false, error: null });
          return;
        }

        // Fetch app user data
        const { data: appUser, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        setState({
          user: session.user,
          appUser: appUser as AppUser,
          loading: false,
          error: null,
        });
      } catch (err) {
        setState({
          user: null,
          appUser: null,
          loading: false,
          error: err instanceof Error ? err : new Error("Authentication error"),
        });
      }
    })();
  }, [supabase, router, redirectTo, requireAuth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push(redirectTo);
  }, [supabase, router, redirectTo]);

  const updateAppUser = useCallback(async (updates: Partial<AppUser>) => {
    if (!state.user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", state.user.id);

    if (!error) {
      setState((prev) => ({
        ...prev,
        appUser: prev.appUser ? { ...prev.appUser, ...updates } : null,
      }));
    }

    return { error };
  }, [supabase, state.user]);

  return {
    ...state,
    signOut,
    updateAppUser,
    isAuthenticated: !!state.user,
  };
}
