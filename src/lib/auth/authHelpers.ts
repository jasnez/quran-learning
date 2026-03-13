import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/store/authStore";

let browserClient:
  | ReturnType<typeof createBrowserClient<User>>
  | null = null;

function getConfigFromEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return { url, anonKey };
  return null;
}

/**
 * Sync: koristi samo env ili već cacheirani client. Na produkciji ako env
 * nije u buildu, prvo pozovi getBrowserClientAsync() da učitamo config s /api/auth-config.
 */
export function getBrowserClient() {
  if (browserClient) return browserClient;
  const config = getConfigFromEnv();
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  browserClient = createBrowserClient(config.url, config.anonKey);
  return browserClient;
}

let authConfigPromise: Promise<ReturnType<typeof createBrowserClient<User>>> | null = null;

function isProductionOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const origin = window.location.origin;
  return (
    origin.includes("vercel.app") ||
    origin.includes("localhost") === false
  );
}

/**
 * Async: na produkciji uvijek dohvaća config s /api/auth-config (server ima
 * ispravne env varijable). Lokalno koristi NEXT_PUBLIC_* iz env. Tako izbjegnemo
 * "Invalid API key" kad je u client bundle ugrađen krivi ili prazan key pri buildu.
 */
export async function getBrowserClientAsync(): Promise<
  ReturnType<typeof createBrowserClient<User>>
> {
  if (browserClient) return browserClient;
  if (authConfigPromise) return authConfigPromise;

  const useServerConfig = isProductionOrigin();
  if (!useServerConfig) {
    const config = getConfigFromEnv();
    if (config) {
      browserClient = createBrowserClient(config.url, config.anonKey);
      return browserClient;
    }
  }

  authConfigPromise = (async () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${base}/api/auth-config`);
    if (!res.ok) {
      throw new Error("Auth config not available");
    }
    const { url, anonKey } = (await res.json()) as { url: string; anonKey: string };
    if (!url || !anonKey) {
      throw new Error("Invalid auth config");
    }
    browserClient = createBrowserClient(url, anonKey);
    return browserClient;
  })();

  return authConfigPromise;
}

export function getCurrentUser(): User | null {
  return useAuthStore.getState().user;
}

export function isAuthenticated(): boolean {
  return !!useAuthStore.getState().user;
}

export async function signOut(): Promise<void> {
  const client = await getBrowserClientAsync();
  await client.auth.signOut();
  useAuthStore.getState().setUser(null);
}

export async function updatePassword(
  newPassword: string
): Promise<{ error: Error | null }> {
  const client = await getBrowserClientAsync();
  const { error } = await client.auth.updateUser({ password: newPassword });
  return { error: error ?? null };
}

export async function ensureUserProfileAndSettings(user: User): Promise<void> {
  const client = await getBrowserClientAsync();
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

