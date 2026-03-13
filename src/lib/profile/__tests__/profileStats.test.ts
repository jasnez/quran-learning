/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProfileStats } from "../profileStats";

const mockSelect = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: async (column: string, value: unknown) => {
          // user_progress: eq("user_id", userId)
          if (table === "user_progress" && column === "user_id" && value === "user-1") {
            return mockSelect("user_progress");
          }
          return { data: [], error: null };
        },
        in: async (column: string, _values: unknown[]) => {
          // ayahs: in("id", ayahIds)
          if (table === "ayahs" && column === "id") {
            return mockSelect("ayahs");
          }
          // surahs: in("id", surahIds)
          if (table === "surahs" && column === "id") {
            return mockSelect("surahs");
          }
          // audio_tracks: in("ayah_id", ayahIds)
          if (table === "audio_tracks" && column === "ayah_id") {
            return mockSelect("audio_tracks");
          }
          return { data: [], error: null };
        },
      }),
    }),
  })),
}));

import { getProfileStats } from "../profileStats";

describe("getProfileStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zeros when there is no progress", async () => {
    mockSelect.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const stats = (await getProfileStats("user-1")) as ProfileStats;

    expect(stats.totalSurahsStarted).toBe(0);
    expect(stats.totalSurahsCompleted).toBe(0);
    expect(stats.totalAyahsListened).toBe(0);
    expect(stats.totalListeningTimeMs).toBe(0);
    expect(stats.longestStreakDays).toBe(0);
    expect(stats.favoriteSurahName).toBeNull();
  });

  it("computes listening time and longest streak from progress and audio_tracks", async () => {
    // 1) user_progress rows (mockSelect("user_progress"))
    mockSelect
      .mockResolvedValueOnce({
        data: [
          {
            user_id: "user-1",
            ayah_id: 1,
            listened: true,
            listen_count: 2,
            last_listened_at: "2025-01-01T10:00:00.000Z",
          },
          {
            user_id: "user-1",
            ayah_id: 2,
            listened: false,
            listen_count: 1,
            last_listened_at: "2025-01-02T09:00:00.000Z",
          },
          {
            user_id: "user-1",
            ayah_id: 3,
            listened: true,
            listen_count: 0,
            last_listened_at: "2025-01-04T12:00:00.000Z",
          },
        ],
        error: null,
      })
      // 2) ayahs rows (mockSelect("ayahs"))
      .mockResolvedValueOnce({
        data: [
          { id: 1, surah_id: 10, ayah_number_in_surah: 1 },
          { id: 2, surah_id: 10, ayah_number_in_surah: 2 },
          { id: 3, surah_id: 11, ayah_number_in_surah: 1 },
        ],
        error: null,
      })
      // 3) surahs rows (mockSelect("surahs"))
      .mockResolvedValueOnce({
        data: [
          { id: 10, surah_number: 1, name_latin: "Al-Fatihah", ayah_count: 7 },
          { id: 11, surah_number: 2, name_latin: "Al-Baqarah", ayah_count: 286 },
        ],
        error: null,
      })
      // 4) audio_tracks rows (mockSelect("audio_tracks"))
      .mockResolvedValueOnce({
        data: [
          { ayah_id: 1, duration_ms: 1000, is_primary: true },
          { ayah_id: 2, duration_ms: 2000, is_primary: true },
          { ayah_id: 3, duration_ms: 3000, is_primary: true },
        ],
        error: null,
      });

    const stats = (await getProfileStats("user-1")) as ProfileStats;

    // totalListeningTimeMs = 2*1000 + 1*2000 + 1*3000 = 7000
    expect(stats.totalListeningTimeMs).toBe(7000);

    // Days: 2025-01-01, 2025-01-02 (streak 2), 2025-01-04 (break)
    expect(stats.longestStreakDays).toBe(2);

    // Surah 1 has 2 ayahs listened, surah 2 has 1
    expect(stats.totalSurahsStarted).toBe(2);
    expect(stats.totalAyahsListened).toBe(3);
    expect(stats.favoriteSurahName).toBe("Al-Fatihah");
  });
});

