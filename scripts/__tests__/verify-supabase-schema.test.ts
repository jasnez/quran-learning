/**
 * Tests for verify-supabase-schema: ensures REQUIRED_TABLES matches schema and verifyTable works.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { REQUIRED_TABLES, verifyTable } from "../verify-supabase-schema";

describe("verify-supabase-schema", () => {
  it("REQUIRED_TABLES includes all tables from RUN_ME_IN_SQL_EDITOR.sql", () => {
    const expected = [
      "surahs",
      "ayahs",
      "translations",
      "transliterations",
      "tajwid_markup",
      "reciters",
      "audio_tracks",
      "words",
      "user_profiles",
      "user_settings",
      "user_bookmarks",
      "user_progress",
    ];
    expect(REQUIRED_TABLES).toEqual(expected);
    expect(REQUIRED_TABLES).toHaveLength(12);
  });

  describe("verifyTable", () => {
    it("returns ok: true when select succeeds", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      const supabase = { from: mockFrom } as unknown as ReturnType<
        typeof import("@supabase/supabase-js").createClient
      >;
      const result = await verifyTable(supabase, "surahs");
      expect(result.ok).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns ok: false with error message when select fails", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            error: { message: "relation \"surahs\" does not exist" },
          }),
        }),
      });
      const supabase = { from: mockFrom } as unknown as ReturnType<
        typeof import("@supabase/supabase-js").createClient
      >;
      const result = await verifyTable(supabase, "surahs");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("does not exist");
    });
  });
});
