/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSupabaseClient = {
  from: (table: string) => ({
    select: (_columns: string) => ({
      eq: (column: string, value: unknown) => {
        // surahs query uses maybeSingle()
        if (table === "surahs" && column === "surah_number" && value === 1) {
          return {
            maybeSingle: () =>
              Promise.resolve({
                data: { id: 10 },
                error: null,
              }),
          } as unknown;
        }
        // ayahs query is awaited directly
        if (table === "ayahs" && column === "surah_id" && value === 10) {
          return Promise.resolve({
            data: [{ id: 100, ayah_number_in_surah: 1 }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      },
    }),
  }),
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

import { getAyahId, __clearAyahIdCacheForTests } from "../ayahIdMapper";

describe("ayahIdMapper", () => {
  beforeEach(() => {
    __clearAyahIdCacheForTests();
  });

  it("returns a valid ayah id for a known surah and ayah number", async () => {
    const id = await getAyahId(1, 1);
    if (id === null) {
      throw new Error("Expected non-null ayah id for surah 1, ayah 1");
    }
    expect(id).toBeGreaterThan(0);
  });

  it("returns the same id on repeated calls (cache hit)", async () => {
    const first = await getAyahId(1, 1);
    const second = await getAyahId(1, 1);
    expect(second).toBe(first);
  });
});

