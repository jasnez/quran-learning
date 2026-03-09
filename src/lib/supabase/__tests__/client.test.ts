/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Supabase client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns a client with from and auth when env is set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const { getSupabaseClient: getClient } = await import("../client");
    const client = getClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(typeof client.auth.getSession).toBe("function");
  });

  it("returns same instance when called twice (singleton)", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const { getSupabaseClient: getClient } = await import("../client");
    const a = getClient();
    const b = getClient();
    expect(a).toBe(b);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    vi.resetModules();
    const { getSupabaseClient: getClient } = await import("../client");
    expect(() => getClient()).toThrow(/SUPABASE_URL|Supabase/);
  });

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.resetModules();
    const { getSupabaseClient: getClient } = await import("../client");
    expect(() => getClient()).toThrow(/ANON_KEY|Supabase/);
  });

  it("uses service role key on server when set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    vi.resetModules();
    const { getSupabaseClient: getClient } = await import("../client");
    const client = getClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
