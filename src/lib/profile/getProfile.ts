import { getSupabaseClient } from "@/lib/supabase";

export type ProfileData = {
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Fetches display_name and avatar_url from user_profiles for the given user.
 * Returns nulls if no row or on error.
 */
export async function getProfile(userId: string): Promise<ProfileData> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return { displayName: null, avatarUrl: null };
  }

  const row = data as { display_name: string | null; avatar_url: string | null };
  return {
    displayName: row.display_name ?? null,
    avatarUrl: row.avatar_url ?? null,
  };
}
