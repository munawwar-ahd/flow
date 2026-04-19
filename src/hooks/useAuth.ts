"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { mapSupabaseUser } from "@/types/auth";

export function useAuth(): void {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? mapSupabaseUser(data.user) : null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser]);
}
