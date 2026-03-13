import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll() {
        // no-op: Next middleware already manages cookies
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return (data?.user as User) ?? null;
}

/**
 * Returns the current user if authenticated and email is confirmed.
 * Redirects to /auth/login if not authenticated, or to /auth/confirm-email if email not confirmed.
 */
export async function getServerUserRequireConfirmed(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (!user.email_confirmed_at) {
    redirect("/auth/confirm-email");
  }
  return user;
}

