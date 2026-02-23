"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CallbackPage() {
  const router = useRouter();
  const handled = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.push("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    const timeout = setTimeout(() => {
      router.push("/login?error=auth");
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
}
