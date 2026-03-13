import { getSupabaseClient } from "@/lib/supabase";
import type { Bookmark } from "@/types/bookmarks";
import type { LearningProgress } from "@/store/progressStore";
import type { SettingsState } from "@/types/settings";
import { getLocalBookmarks, getLocalProgress, getLocalSettings } from "./localDataProviders";
import { useSettingsStore } from "@/store/settingsStore";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useProgressStore } from "@/store/progressStore";
import { getAyahId } from "@/lib/quran/ayahIdMapper";

type DbBookmarkRow = {
  user_id: string;
  ayah_id: number;
  note: string | null;
  collection_name: string | null;
  created_at: string;
};

type DbProgressRow = {
  user_id: string;
  ayah_id: number;
  listened: boolean;
  read: boolean;
  listen_count: number;
  last_listened_at: string | null;
};

export async function syncBookmarksToCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const local: Bookmark[] = getLocalBookmarks();
  if (!local.length) return;

  const { data: cloud, error } = await supabase
    .from("user_bookmarks")
    .select("user_id, ayah_id, note, collection_name, created_at")
    .eq("user_id", userId);
  if (error) return;

  const existingAyahIds = new Set((cloud ?? []).map((row) => row.ayah_id));

  const newRows: DbBookmarkRow[] = [];
  for (const b of local) {
    const ayahId = await getAyahId(b.surahNumber, b.ayahNumber);
    if (!ayahId || existingAyahIds.has(ayahId)) continue;
    newRows.push({
      user_id: userId,
      ayah_id: ayahId,
      note: b.note ?? null,
      collection_name: b.collectionId ?? null,
      created_at: b.createdAt,
    });
  }

  if (!newRows.length) return;

  await supabase.from("user_bookmarks").insert(newRows);
}

export async function syncSettingsToCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const settings: SettingsState | null = getLocalSettings();
  if (!settings) return;

  const row = {
    id: userId,
    theme: settings.theme,
    arabic_font_size: settings.arabicFontSize,
    show_transliteration: settings.showTransliteration,
    show_translation: settings.showTranslation,
    show_tajwid_colors: settings.showTajwidColors,
    selected_reciter_id: settings.selectedReciterId,
    playback_speed: settings.playbackSpeed,
    repeat_mode: settings.repeatMode,
    auto_play_next: settings.autoPlayNext,
  };

  await supabase.from("user_settings").upsert(row, { onConflict: "id" });
}

export async function syncProgressToCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const local: LearningProgress | null = getLocalProgress();
  if (!local) return;

  const { data: cloud, error } = await supabase
    .from("user_progress")
    .select("user_id, ayah_id, listened, read, listen_count, last_listened_at")
    .eq("user_id", userId);
  if (error) return;

  const cloudByAyah = new Map<number, DbProgressRow>();
  for (const row of cloud ?? []) {
    cloudByAyah.set(row.ayah_id, row as DbProgressRow);
  }

  const mergedRows: DbProgressRow[] = [];

  // For now we only know how many ayahs were listened; we treat each listened ayah as listen_count += 1
  for (const [surahNumberKey, p] of Object.entries(local.surahProgressMap ?? {})) {
    const surahNumber = Number(surahNumberKey);
    if (!Number.isInteger(surahNumber)) continue;

    for (const ayahNumber of p.ayahsListened) {
      const ayahId = await getAyahId(surahNumber, ayahNumber);
      if (!ayahId) continue;
      const existing = cloudByAyah.get(ayahId);
      const listenCountBase = existing?.listen_count ?? 0;
      const listenedFlag = Boolean(existing?.listened || true);
      const readFlag = Boolean(existing?.read);
      mergedRows.push({
        user_id: userId,
        ayah_id: ayahId,
        listened: listenedFlag,
        read: readFlag,
        listen_count: listenCountBase + 1,
        last_listened_at: new Date().toISOString(),
      });
      cloudByAyah.delete(ayahId);
    }
  }

  // Preserve any remaining cloud-only rows
  for (const row of cloudByAyah.values()) {
    mergedRows.push(row);
  }

  if (!mergedRows.length) return;

  await supabase.from("user_progress").upsert(mergedRows, {
    onConflict: "user_id,ayah_id",
  });
}

export async function mergeLocalAndCloudData(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const local: LearningProgress | null = getLocalProgress();

  const { data: cloud, error } = await supabase
    .from("user_progress")
    .select("user_id, ayah_id, listened, read, listen_count, last_listened_at")
    .eq("user_id", userId);
  if (error) return;

  const cloudByAyah = new Map<number, DbProgressRow>();
  for (const row of cloud ?? []) {
    cloudByAyah.set(row.ayah_id, row as DbProgressRow);
  }

  const merged: DbProgressRow[] = [];

  if (local) {
    for (const [surahNumberKey, p] of Object.entries(local.surahProgressMap ?? {})) {
      const surahNumber = Number(surahNumberKey);
      if (!Number.isInteger(surahNumber)) continue;
      for (const ayahNumber of p.ayahsListened) {
        const ayahId = await getAyahId(surahNumber, ayahNumber);
        if (!ayahId) continue;
        const existing = cloudByAyah.get(ayahId);
        const listened = Boolean(existing?.listened || true);
        const read = Boolean(existing?.read);
        const listenCount = (existing?.listen_count ?? 0) + 1;
        const lastListenedAt =
          p.lastAccessedAt && existing?.last_listened_at
            ? new Date(p.lastAccessedAt) > new Date(existing.last_listened_at)
              ? p.lastAccessedAt
              : existing.last_listened_at
            : p.lastAccessedAt ?? existing?.last_listened_at ?? null;
        merged.push({
          user_id: userId,
          ayah_id: ayahId,
          listened,
          read,
          listen_count: listenCount,
          last_listened_at: lastListenedAt,
        });
        cloudByAyah.delete(ayahId);
      }
    }
  }

  // Keep remaining cloud-only rows
  for (const row of cloudByAyah.values()) {
    merged.push(row);
  }

  if (!merged.length) return;

  await supabase.from("user_progress").upsert(merged, {
    onConflict: "user_id,ayah_id",
  });
}

export async function loadUserDataFromCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "theme, arabic_font_size, show_transliteration, show_translation, show_tajwid_colors, selected_reciter_id, playback_speed, repeat_mode, auto_play_next"
    )
    .eq("id", userId);

  if (error || !data || data.length === 0) return;
  const row = data[0] as {
    theme?: string | null;
    arabic_font_size?: number | null;
    show_transliteration?: boolean | null;
    show_translation?: boolean | null;
    show_tajwid_colors?: boolean | null;
    selected_reciter_id?: string | null;
    playback_speed?: number | null;
    repeat_mode?: string | null;
    auto_play_next?: boolean | null;
  };

  useSettingsStore.setState((prev) => ({
    ...prev,
    theme: (row.theme === "light" || row.theme === "dark" || row.theme === "sepia"
      ? row.theme
      : prev.theme) as any,
    arabicFontSize: row.arabic_font_size ?? prev.arabicFontSize,
    showTransliteration:
      row.show_transliteration != null ? row.show_transliteration : prev.showTransliteration,
    showTranslation:
      row.show_translation != null ? row.show_translation : prev.showTranslation,
    showTajwidColors:
      row.show_tajwid_colors != null ? row.show_tajwid_colors : prev.showTajwidColors,
    selectedReciterId:
      row.selected_reciter_id !== undefined ? row.selected_reciter_id : prev.selectedReciterId,
    playbackSpeed: row.playback_speed ?? prev.playbackSpeed,
    repeatMode:
      row.repeat_mode === "off" || row.repeat_mode === "surah" || row.repeat_mode === "ayah"
        ? (row.repeat_mode as any)
        : prev.repeatMode,
    autoPlayNext:
      row.auto_play_next != null ? row.auto_play_next : prev.autoPlayNext,
  }));
}

export async function loadBookmarksFromCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: bookmarkRows, error: bookmarkErr } = await supabase
    .from("user_bookmarks")
    .select("ayah_id, note, collection_name, created_at")
    .eq("user_id", userId);

  if (bookmarkErr || !bookmarkRows || bookmarkRows.length === 0) return;

  type UserBookmarkRow = {
    ayah_id: number;
    note: string | null;
    collection_name: string | null;
    created_at: string;
  };

  const uniqueAyahIds = Array.from(
    new Set((bookmarkRows as UserBookmarkRow[]).map((r) => r.ayah_id))
  );

  const ayahDetails: {
    [ayahId: number]: {
      surah_id: number;
      ayah_number_in_surah: number;
      arabic_text: string;
    };
  } = {};

  for (const ayahId of uniqueAyahIds) {
    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, surah_id, ayah_number_in_surah, arabic_text")
      .eq("id", ayahId);
    if (ayahErr || !ayahRows || ayahRows.length === 0) continue;
    const row = ayahRows[0] as {
      id: number;
      surah_id: number;
      ayah_number_in_surah: number;
      arabic_text: string;
    };
    ayahDetails[row.id] = {
      surah_id: row.surah_id,
      ayah_number_in_surah: row.ayah_number_in_surah,
      arabic_text: row.arabic_text,
    };
  }

  const uniqueSurahIds = Array.from(
    new Set(Object.values(ayahDetails).map((a) => a.surah_id))
  );

  const surahDetails: {
    [surahId: number]: { surah_number: number; name_latin: string };
  } = {};

  for (const surahId of uniqueSurahIds) {
    const { data: surahRows, error: surahErr } = await supabase
      .from("surahs")
      .select("id, surah_number, name_latin")
      .eq("id", surahId);
    if (surahErr || !surahRows || surahRows.length === 0) continue;
    const row = surahRows[0] as {
      id: number;
      surah_number: number;
      name_latin: string;
    };
    surahDetails[row.id] = {
      surah_number: row.surah_number,
      name_latin: row.name_latin,
    };
  }

  const cloudBookmarks = (bookmarkRows as UserBookmarkRow[])
    .map((row) => {
      const ayah = ayahDetails[row.ayah_id];
      if (!ayah) return null;
      const surah = surahDetails[ayah.surah_id];
      if (!surah) return null;

      const surahNumber = surah.surah_number;
      const ayahNumber = ayah.ayah_number_in_surah;
      const id = `${surahNumber}-${ayahNumber}`;

      return {
        id,
        surahNumber,
        ayahNumber,
        surahNameLatin: surah.name_latin,
        arabicText: ayah.arabic_text.slice(0, 50),
        createdAt: row.created_at,
        ...(row.note ? { note: row.note } : {}),
      };
    })
    .filter((b): b is Bookmark => b != null);

  if (!cloudBookmarks.length) return;

  useBookmarkStore.setState((prev) => {
    const existing = prev.bookmarks ?? [];
    const existingIds = new Set(existing.map((b) => b.id));
    const merged = [...existing];
    for (const b of cloudBookmarks) {
      if (!existingIds.has(b.id)) {
        merged.push(b);
      }
    }
    return { ...prev, bookmarks: merged };
  });
}

export async function loadProgressFromCloud(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: progressRows, error: progressErr } = await supabase
    .from("user_progress")
    .select("ayah_id, listened, read, listen_count, last_listened_at")
    .eq("user_id", userId);

  if (progressErr || !progressRows || progressRows.length === 0) return;

  type UserProgressRow = {
    ayah_id: number;
    listened: boolean;
    read: boolean;
    listen_count: number;
    last_listened_at: string | null;
  };

  const ayahIds = Array.from(
    new Set((progressRows as UserProgressRow[]).map((r) => r.ayah_id))
  );

  const ayahInfo: {
    [ayahId: number]: {
      surah_id: number;
      ayah_number_in_surah: number;
    };
  } = {};

  for (const ayahId of ayahIds) {
    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, surah_id, ayah_number_in_surah")
      .eq("id", ayahId);
    if (ayahErr || !ayahRows || ayahRows.length === 0) continue;
    const row = ayahRows[0] as {
      id: number;
      surah_id: number;
      ayah_number_in_surah: number;
    };
    ayahInfo[row.id] = {
      surah_id: row.surah_id,
      ayah_number_in_surah: row.ayah_number_in_surah,
    };
  }

  const surahIds = Array.from(
    new Set(Object.values(ayahInfo).map((a) => a.surah_id))
  );

  const surahMap: { [surahId: number]: number } = {};

  for (const surahId of surahIds) {
    const { data: surahRows, error: surahErr } = await supabase
      .from("surahs")
      .select("id, surah_number")
      .eq("id", surahId);
    if (surahErr || !surahRows || surahRows.length === 0) continue;
    const row = surahRows[0] as { id: number; surah_number: number };
    surahMap[row.id] = row.surah_number;
  }

  const surahProgressMap: Record<number, SurahProgress> = {};

  for (const row of progressRows as UserProgressRow[]) {
    const ayah = ayahInfo[row.ayah_id];
    if (!ayah) continue;
    const surahNumber = surahMap[ayah.surah_id];
    if (!surahNumber) continue;
    const ayahNumber = ayah.ayah_number_in_surah;

    let entry = surahProgressMap[surahNumber];
    if (!entry) {
      entry = {
        surahNumber,
        totalAyahs: ayahNumber,
        ayahsListened: new Set(),
        ayahsRead: new Set(),
        completionPercent: 0,
        lastAccessedAt: row.last_listened_at ?? new Date().toISOString(),
        timeSpentMs: 0,
      };
      surahProgressMap[surahNumber] = entry;
    }

    entry.totalAyahs = Math.max(entry.totalAyahs, ayahNumber);
    if (row.listened || row.listen_count > 0) {
      entry.ayahsListened.add(ayahNumber);
    }
    if (row.read) {
      entry.ayahsRead.add(ayahNumber);
    }
    if (row.last_listened_at) {
      if (
        !entry.lastAccessedAt ||
        new Date(row.last_listened_at) > new Date(entry.lastAccessedAt)
      ) {
        entry.lastAccessedAt = row.last_listened_at;
      }
    }
  }

  for (const entry of Object.values(surahProgressMap)) {
    entry.completionPercent =
      entry.totalAyahs > 0
        ? (entry.ayahsListened.size / entry.totalAyahs) * 100
        : 0;
  }

  useProgressStore.setState((prev) => ({
    ...prev,
    surahProgressMap: {
      ...(prev.surahProgressMap ?? {}),
      ...surahProgressMap,
    },
  }));
}

