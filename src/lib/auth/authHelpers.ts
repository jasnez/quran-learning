import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";

let browserClient:
  | ReturnType<typeof createBrowserClient<User>>
  | null = null;

function getBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export function getCurrentUser(): User | null {
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().user;
}

export async function signOut(): Promise<void> {
  const client = getBrowserClient();
  await client.auth.signOut();
  useAuthStore.getState().setUser(null);
}

export async function updatePassword(
  newPassword: string
): Promise<{ error: Error | null }> {
  const client = getBrowserClient();
  const { error } = await client.auth.updateUser({ password: newPassword });
  return { error: error ?? null };
}

export async function ensureUserProfileAndSettings(user: User): Promise<void> {
  const client = getBrowserClient();
  const userId = user.id;
  const email = user.email ?? "";
  const displayName =
    (user.user_metadata as { full_name?: string })?.full_name ??
    email.split("@")[0] ??
    "";

  // Supabase client has no generated DB types for user_profiles/user_settings; cast for build
  await client.from("user_profiles").upsert(
    { id: userId, display_name: displayName || null } as never,
    { onConflict: "id" }
  );
  await client.from("user_settings").upsert(
    { id: userId } as never,
    { onConflict: "id" }
  );
}

export function __setCurrentUserForTests(user: User | null) {
  useAuthStore.getState().setUser(user);
}

