import { create } from "zustand";
import type { User } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";

type AuthState = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  setLoading: (l: boolean) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },
}));
