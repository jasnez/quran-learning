/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Bookmark } from "@/types/bookmarks";
import type { LearningProgress, SurahProgress } from "@/store/progressStore";
import type { SettingsState } from "@/types/settings";

vi.mock("@/lib/quran/ayahIdMapper", () => ({
  getAyahId: vi.fn(async (_surah: number, ayah: number) => ayah),
}));

// We will mock Supabase client and local store access inside the service module.
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

const settingsStoreMock = vi.hoisted(() => ({
  useSettingsStore: {
    setState: vi.fn(),
  },
}));

const progressStoreMock = vi.hoisted(() => ({
  useProgressStore: {
    setState: vi.fn(),
  },
}));

const bookmarkStoreMock = vi.hoisted(() => ({
  useBookmarkStore: {
    getState: vi.fn(() => ({ bookmarks: [], collections: [] })),
    setState: vi.fn(),
  },
}));

vi.mock("@/store/settingsStore", () => settingsStoreMock);
vi.mock("@/store/progressStore", () => progressStoreMock);
vi.mock("@/store/bookmarkStore", () => bookmarkStoreMock);

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    from: () => ({
      select: (...args: unknown[]) => {
        // simulate Supabase query builder: .select().eq().then(...)
        return {
          eq: async (..._eqArgs: unknown[]) => mockSelect(...args),
        };
      },
      insert: mockInsert,
      upsert: mockUpsert,
      update: mockUpdate,
    }),
  })),
}));

// Local data providers will be simple exported functions we can mock.
vi.mock("../localDataProviders", () => ({
  getLocalBookmarks: vi.fn<[], Bookmark[]>(() => []),
  getLocalProgress: vi.fn<[], LearningProgress | null>(() => null),
  getLocalSettings: vi.fn<[], SettingsState | null>(() => null),
}));

import {
  syncBookmarksToCloud,
  syncProgressToCloud,
  syncSettingsToCloud,
  mergeLocalAndCloudData,
  loadUserDataFromCloud,
  loadBookmarksFromCloud,
  loadProgressFromCloud,
} from "../dataSyncService";
import {
  getLocalBookmarks,
  getLocalProgress,
  getLocalSettings,
} from "../localDataProviders";

describe("dataSyncService merge logic", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncBookmarksToCloud inserts only bookmarks that are not yet in cloud", async () => {
    const localBookmarks: Bookmark[] = [
      {
        id: "1-1",
        surahNumber: 1,
        ayahNumber: 1,
        surahNameLatin: "Al-Fatihah",
        arabicText: "بِسْمِ",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "1-2",
        surahNumber: 1,
        ayahNumber: 2,
        surahNameLatin: "Al-Fatihah",
        arabicText: "ٱلْحَمْدُ",
        createdAt: "2025-01-02T00:00:00.000Z",
      },
    ];

    (getLocalBookmarks as unknown as vi.Mock).mockReturnValue(localBookmarks);

    // Cloud already has bookmark 1-1, but not 1-2
    mockSelect.mockResolvedValueOnce({
      data: [
        {
          user_id: userId,
          ayah_id: 1,
          note: null,
          collection_name: null,
          created_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });

    mockInsert.mockResolvedValueOnce({ error: null });

    await syncBookmarksToCloud(userId);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const payload = mockInsert.mock.calls[0][0];
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: userId,
          ayah_id: 2,
        }),
      ])
    );
  });

  it("syncSettingsToCloud upserts settings row from local settings", async () => {
    const localSettings: SettingsState = {
      theme: "dark",
      arabicFontSize: 30,
      showTransliteration: false,
      showTranslation: true,
      showTajwidColors: true,
      selectedReciterId: "test-reciter",
      playbackSpeed: 1.25,
      repeatMode: "ayah",
      autoPlayNext: false,
    };

    (getLocalSettings as unknown as vi.Mock).mockReturnValue(localSettings);

    mockUpsert.mockResolvedValueOnce({ error: null });

    await syncSettingsToCloud(userId);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload).toMatchObject({
      id: userId,
      theme: localSettings.theme,
      arabic_font_size: localSettings.arabicFontSize,
      show_transliteration: localSettings.showTransliteration,
      show_translation: localSettings.showTranslation,
      show_tajwid_colors: localSettings.showTajwidColors,
      selected_reciter_id: localSettings.selectedReciterId,
      playback_speed: localSettings.playbackSpeed,
      repeat_mode: localSettings.repeatMode,
      auto_play_next: localSettings.autoPlayNext,
    });
  });

  it("syncProgressToCloud merges listen/read flags and counters additively", async () => {
    const localSurahProgress: Record<number, SurahProgress> = {
      1: {
        surahNumber: 1,
        totalAyahs: 7,
        ayahsListened: new Set([1, 2]),
        ayahsRead: new Set([1]),
        completionPercent: 0,
        lastAccessedAt: "2025-01-01T00:00:00.000Z",
        timeSpentMs: 1000,
      },
    };

    const localProgress: LearningProgress = {
      lastSurahNumber: 1,
      lastAyahNumber: 2,
      lastSurahNameLatin: "Al-Fatihah",
      lastMode: "reader",
      timestamp: "2025-01-01T00:00:00.000Z",
      totalListeningTimeMs: 1000,
      surahsVisited: [1],
      ayahsListened: 2,
      surahProgressMap: localSurahProgress,
      tajwidLessonProgress: {},
      testResults: [],
    };

    (getLocalProgress as unknown as vi.Mock).mockReturnValue(localProgress);

    // Cloud has ayah 1 listened=true, read=false, listen_count=1
    mockSelect.mockResolvedValueOnce({
      data: [
        {
          user_id: userId,
          ayah_id: 1,
          listened: true,
          read: false,
          listen_count: 1,
          last_listened_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });

    mockUpsert.mockResolvedValueOnce({ error: null });

    await syncProgressToCloud(userId);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const rows = mockUpsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    // Expect entries for at least ayah 1 and 2
    const ayah1 = rows.find((r) => r.ayah_id === 1);
    const ayah2 = rows.find((r) => r.ayah_id === 2);
    expect(ayah1).toBeDefined();
    expect(ayah2).toBeDefined();
    // listen_count for ayah 1 should be at least 1 (cloud) + 1 (local event)
    expect((ayah1 as any).listen_count).toBeGreaterThanOrEqual(2);
    // listened flag from either side should be preserved
    expect((ayah1 as any).listened).toBe(true);
  });

  it("mergeLocalAndCloudData never deletes data: union of local and cloud ayahs is preserved", async () => {
    const localSurahProgress: Record<number, SurahProgress> = {
      1: {
        surahNumber: 1,
        totalAyahs: 7,
        ayahsListened: new Set([1, 2, 3]),
        ayahsRead: new Set([1]),
        completionPercent: 0,
        lastAccessedAt: "2025-01-02T00:00:00.000Z",
        timeSpentMs: 2000,
      },
    };
    const localProgress: LearningProgress = {
      lastSurahNumber: 1,
      lastAyahNumber: 3,
      lastSurahNameLatin: "Al-Fatihah",
      lastMode: "reader",
      timestamp: "2025-01-02T00:00:00.000Z",
      totalListeningTimeMs: 2000,
      surahsVisited: [1],
      ayahsListened: 3,
      surahProgressMap: localSurahProgress,
      tajwidLessonProgress: {},
      testResults: [],
    };
    (getLocalProgress as unknown as vi.Mock).mockReturnValue(localProgress);

    // Cloud already has ayah 4 listened
    mockSelect.mockResolvedValueOnce({
      data: [
        {
          user_id: userId,
          ayah_id: 4,
          listened: true,
          read: false,
          listen_count: 1,
          last_listened_at: "2025-01-01T00:00:00.000Z",
        },
      ],
      error: null,
    });

    mockUpsert.mockResolvedValueOnce({ error: null });

    await mergeLocalAndCloudData(userId);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const rows = mockUpsert.mock.calls[0][0] as Array<{ ayah_id: number }>;
    const ayahIds = rows.map((r) => r.ayah_id).sort();
    // union {1,2,3} (local) U {4} (cloud) = {1,2,3,4}
    expect(ayahIds).toEqual([1, 2, 3, 4]);
  });

  it("loadBookmarksFromCloud merges cloud bookmarks into local store without duplicates", async () => {
    const existingBookmark: Bookmark = {
      id: "1-1",
      surahNumber: 1,
      ayahNumber: 1,
      surahNameLatin: "Al-Fatihah",
      arabicText: "بِسْمِ",
      createdAt: "2025-01-01T00:00:00.000Z",
    };

    (bookmarkStoreMock.useBookmarkStore.getState as unknown as vi.Mock).mockReturnValue({
      bookmarks: [existingBookmark],
      collections: [],
    });

    // 1) user_bookmarks row for ayah_id 100 (surah 1, ayah 2)
    mockSelect
      .mockResolvedValueOnce({
        data: [
          {
            user_id: userId,
            ayah_id: 100,
            note: null,
            collection_name: null,
            created_at: "2025-01-02T00:00:00.000Z",
          },
        ],
        error: null,
      })
      // 2) ayahs row for id 100
      .mockResolvedValueOnce({
        data: [
          {
            id: 100,
            surah_id: 10,
            ayah_number_in_surah: 2,
            arabic_text: "آية",
          },
        ],
        error: null,
      })
      // 3) surahs row for id 10
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            surah_number: 1,
            name_latin: "Al-Fatihah",
          },
        ],
        error: null,
      });

    await loadBookmarksFromCloud(userId);

    expect(bookmarkStoreMock.useBookmarkStore.setState).toHaveBeenCalledTimes(1);
    const updater = bookmarkStoreMock.useBookmarkStore.setState.mock.calls[0][0] as (
      prev: any
    ) => any;
    const updated = updater({
      bookmarks: [existingBookmark],
      collections: [],
    });

    expect(updated.bookmarks).toHaveLength(2);
    const ids = updated.bookmarks.map((b: Bookmark) => b.id).sort();
    expect(ids).toEqual(["1-1", "1-2"]);
    const newBookmark = updated.bookmarks.find((b: Bookmark) => b.id === "1-2")!;
    expect(newBookmark.surahNumber).toBe(1);
    expect(newBookmark.ayahNumber).toBe(2);
    expect(newBookmark.surahNameLatin).toBe("Al-Fatihah");
    expect(newBookmark.arabicText).toBe("آية".slice(0, 50));
  });

  it("loadProgressFromCloud populates surahProgressMap from cloud user_progress", async () => {
    const now = "2025-01-01T00:00:00.000Z";

    // 1) user_progress rows
    mockSelect
      .mockResolvedValueOnce({
        data: [
          {
            user_id: userId,
            ayah_id: 100,
            listened: true,
            read: false,
            listen_count: 2,
            last_listened_at: now,
          },
        ],
        error: null,
      })
      // 2) ayahs row
      .mockResolvedValueOnce({
        data: [
          {
            id: 100,
            surah_id: 10,
            ayah_number_in_surah: 3,
          },
        ],
        error: null,
      })
      // 3) surahs row
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            surah_number: 1,
          },
        ],
        error: null,
      });

    await loadProgressFromCloud(userId);

    expect(progressStoreMock.useProgressStore.setState).toHaveBeenCalledTimes(1);
    const updater = progressStoreMock.useProgressStore.setState.mock.calls[0][0] as (
      prev: any
    ) => any;
    const updated = updater({ surahProgressMap: {} });

    expect(updated.surahProgressMap).toBeDefined();
    const entry = updated.surahProgressMap[1];
    expect(entry).toBeDefined();
    expect(entry.surahNumber).toBe(1);
    expect(entry.totalAyahs).toBeGreaterThanOrEqual(3);
    expect(entry.ayahsListened instanceof Set).toBe(true);
    expect(entry.ayahsListened.has(3)).toBe(true);
    expect(entry.ayahsRead instanceof Set).toBe(true);
    expect(entry.ayahsRead.size).toBe(0);
    expect(entry.completionPercent).toBeGreaterThan(0);
  });

  it("loadUserDataFromCloud hydrates settings from user_settings row", async () => {
    const userSettingsRow = {
      id: userId,
      theme: "dark",
      arabic_font_size: 32,
      show_transliteration: false,
      show_translation: true,
      show_tajwid_colors: false,
      selected_reciter_id: "test-reciter",
      playback_speed: 1.5,
      repeat_mode: "surah",
      auto_play_next: false,
    };

    mockSelect.mockResolvedValueOnce({
      data: [userSettingsRow],
      error: null,
    });

    await loadUserDataFromCloud(userId);

    expect(settingsStoreMock.useSettingsStore.setState).toHaveBeenCalledTimes(1);
    const updater = settingsStoreMock.useSettingsStore.setState.mock.calls[0][0] as (
      prev: any
    ) => any;
    const updated = updater({
      theme: "light",
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
      selectedReciterId: "mishary-alafasy",
      playbackSpeed: 1,
      repeatMode: "off",
      autoPlayNext: true,
    });

    expect(updated).toMatchObject({
      theme: "dark",
      arabicFontSize: 32,
      showTransliteration: false,
      showTranslation: true,
      showTajwidColors: false,
      selectedReciterId: "test-reciter",
      playbackSpeed: 1.5,
      repeatMode: "surah",
      autoPlayNext: false,
    });
  });
});

