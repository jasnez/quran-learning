import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProfile } from "../getProfile";

const getSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({ getSupabaseClient: getSupabaseClientMock }));

describe("getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns displayName and avatarUrl when row exists", async () => {
    getSupabaseClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  display_name: "Alice",
                  avatar_url: "https://example.com/avatar.png",
                },
                error: null,
              }),
          }),
        }),
      }),
    });

    const result = await getProfile("user-1");

    expect(result).toEqual({
      displayName: "Alice",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("returns nulls when no row", async () => {
    getSupabaseClientMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    });

    const result = await getProfile("user-2");

    expect(result).toEqual({ displayName: null, avatarUrl: null });
  });
});
