import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export function mapSupabaseUser(u: SupabaseUser): User {
  const md = (u.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (k: string): string | null =>
    typeof md[k] === "string" ? (md[k] as string) : null;
  return {
    id: u.id,
    email: u.email ?? null,
    fullName: pick("full_name") ?? pick("name") ?? null,
    avatarUrl: pick("avatar_url") ?? pick("picture") ?? null,
  };
}
