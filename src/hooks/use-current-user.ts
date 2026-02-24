"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UseCurrentUserOptions {
  redirectTo?: string;
  required?: boolean;
}

/**
 * Hook to get the current authenticated user
 * Caches the session and provides user info
 */
export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const { redirectTo = "/login", required = true } = options;
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
      } else if (required) {
        router.push(redirectTo);
        return;
      }

      setLoading(false);
    }

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (!session?.user && required) {
            router.push(redirectTo);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, redirectTo, required]);

  return {
    user,
    userId: user?.id ?? null,
    loading,
    isAuthenticated: !!user,
  };
}
