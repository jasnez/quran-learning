import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/**
 * Returns the Supabase client singleton.
 * - In the browser: always uses NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * - On the server: uses SUPABASE_SERVICE_ROLE_KEY when set (bypasses RLS; recommended for production), otherwise anon.
 * Throws if required env vars are missing.
 */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (typeof window !== "undefined") {
    if (!clientInstance) {
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
      clientInstance = createClient(url, anonKey);
    }
    return clientInstance;
  }

  // Server: prefer service role when set (bypasses RLS)
  if (serverClient) return serverClient;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    serverClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  } else {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
    serverClient = createClient(url, anonKey);
  }
  return serverClient;
}
