import { getSupabaseClient } from "@/lib/supabase";

export type ProfileStats = {
  totalSurahsStarted: number;
  totalSurahsCompleted: number;
  totalAyahsListened: number;
  totalListeningTimeMs: number;
  longestStreakDays: number;
  favoriteSurahName: string | null;
};

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = getSupabaseClient();

  const { data: progressRows, error } = await supabase
    .from("user_progress")
    .select("ayah_id, listened, listen_count, last_listened_at")
    .eq("user_id", userId);

  if (error || !progressRows || progressRows.length === 0) {
    return {
      totalSurahsStarted: 0,
      totalSurahsCompleted: 0,
      totalAyahsListened: 0,
      totalListeningTimeMs: 0,
      longestStreakDays: 0,
      favoriteSurahName: null,
    };
  }

  type ProgressRow = {
    ayah_id: number;
    listened: boolean;
    listen_count: number;
    last_listened_at: string | null;
  };

  const ayahIds = Array.from(new Set((progressRows as ProgressRow[]).map((r) => r.ayah_id)));

  const { data: ayahRows } = await supabase
    .from("ayahs")
    .select("id, surah_id, ayah_number_in_surah")
    .in("id", ayahIds);

  const ayahInfo = new Map<number, { surah_id: number; ayah_number_in_surah: number }>();
  for (const row of (ayahRows ?? []) as {
    id: number;
    surah_id: number;
    ayah_number_in_surah: number;
  }[]) {
    ayahInfo.set(row.id, {
      surah_id: row.surah_id,
      ayah_number_in_surah: row.ayah_number_in_surah,
    });
  }

  const surahIds = Array.from(new Set(Array.from(ayahInfo.values()).map((a) => a.surah_id)));

  const { data: surahRows } = await supabase
    .from("surahs")
    .select("id, surah_number, name_latin, ayah_count")
    .in("id", surahIds);

  const surahInfo = new Map<
    number,
    { surah_number: number; name_latin: string; ayah_count: number }
  >();
  for (const row of (surahRows ?? []) as {
    id: number;
    surah_number: number;
    name_latin: string;
    ayah_count: number;
  }[]) {
    surahInfo.set(row.id, {
      surah_number: row.surah_number,
      name_latin: row.name_latin,
      ayah_count: row.ayah_count,
    });
  }

  const surahListenCounts = new Map<number, number>();
  const surahAyahSet = new Map<number, Set<number>>();

  for (const row of progressRows as ProgressRow[]) {
    const info = ayahInfo.get(row.ayah_id);
    if (!info) continue;
    const surah = surahInfo.get(info.surah_id);
    if (!surah) continue;

    const surahNumber = surah.surah_number;
    const ayahNum = info.ayah_number_in_surah;

    const prevCount = surahListenCounts.get(surahNumber) ?? 0;
    surahListenCounts.set(surahNumber, prevCount + (row.listen_count || (row.listened ? 1 : 0)));

    if (!surahAyahSet.has(surahNumber)) {
      surahAyahSet.set(surahNumber, new Set());
    }
    surahAyahSet.get(surahNumber)!.add(ayahNum);
  }

  const totalAyahsListened = Array.from(surahAyahSet.values()).reduce(
    (acc, set) => acc + set.size,
    0
  );

  const totalSurahsStarted = surahAyahSet.size;

  let totalSurahsCompleted = 0;
  for (const [surahNumber, set] of surahAyahSet.entries()) {
    const surah = Array.from(surahInfo.values()).find(
      (s) => s.surah_number === surahNumber
    );
    if (surah && set.size >= surah.ayah_count) {
      totalSurahsCompleted += 1;
    }
  }

  let favoriteSurahName: string | null = null;
  let maxListenCount = 0;
  for (const [surahNumber, count] of surahListenCounts.entries()) {
    if (count > maxListenCount) {
      maxListenCount = count;
      const surah = Array.from(surahInfo.values()).find(
        (s) => s.surah_number === surahNumber
      );
      favoriteSurahName = surah?.name_latin ?? null;
    }
  }

  // Audio durations for total listening time
  const { data: audioRows } = await supabase
    .from("audio_tracks")
    .select("ayah_id, duration_ms, is_primary")
    .in("ayah_id", ayahIds);

  const audioByAyah = new Map<number, number>();
  for (const row of (audioRows ?? []) as {
    ayah_id: number;
    duration_ms: number | null;
    is_primary: boolean;
  }[]) {
    const existing = audioByAyah.get(row.ayah_id);
    if (row.is_primary || existing == null) {
      if (row.duration_ms != null) {
        audioByAyah.set(row.ayah_id, row.duration_ms);
      }
    }
  }

  let totalListeningTimeMs = 0;
  for (const row of progressRows as ProgressRow[]) {
    const duration = audioByAyah.get(row.ayah_id) ?? 0;
    const count = row.listen_count || (row.listened ? 1 : 0);
    totalListeningTimeMs += count * duration;
  }

  // Longest streak: consecutive days with any listening activity
  const dayMs = 24 * 60 * 60 * 1000;
  const dayTimestamps = Array.from(
    new Set(
      (progressRows as ProgressRow[])
        .map((row) => row.last_listened_at)
        .filter((v): v is string => !!v)
        .map((iso) => {
          const d = new Date(iso);
          return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        })
    )
  ).sort((a, b) => a - b);

  let longestStreakDays = 0;
  let currentStreak = 0;
  let prevDay: number | null = null;

  for (const day of dayTimestamps) {
    if (prevDay == null || day !== prevDay + dayMs) {
      currentStreak = 1;
    } else {
      currentStreak += 1;
    }
    longestStreakDays = Math.max(longestStreakDays, currentStreak);
    prevDay = day;
  }

  return {
    totalSurahsStarted,
    totalSurahsCompleted,
    totalAyahsListened,
    totalListeningTimeMs,
    longestStreakDays,
    favoriteSurahName,
  };
}

