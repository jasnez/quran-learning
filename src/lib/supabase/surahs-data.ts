/**
 * Server-side Supabase data for surahs. Used by Server Components and API routes.
 * Avoids self-fetch on Vercel (getBaseUrl/VERCEL_URL can be flaky).
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  SurahSummary,
  SurahDetail,
  Ayah,
  TajwidSegment,
  AyahAudio,
} from "@/types/quran";

const DEFAULT_RECITER_ID = "mishary-alafasy";

function defaultAudioPath(surahNumber: number, ayahNumberInSurah: number): string {
  const s = String(surahNumber).padStart(3, "0");
  const a = String(ayahNumberInSurah).padStart(3, "0");
  return `/audio/${DEFAULT_RECITER_ID}/${s}${a}.mp3`;
}

function rowToSurahSummary(row: {
  surah_number: number;
  slug: string;
  name_arabic: string;
  name_latin: string;
  name_bosnian: string;
  revelation_type: string;
  ayah_count: number;
}): SurahSummary {
  return {
    id: String(row.surah_number),
    surahNumber: row.surah_number,
    slug: row.slug,
    nameArabic: row.name_arabic,
    nameLatin: row.name_latin,
    nameBosnian: row.name_bosnian,
    revelationType: row.revelation_type as "meccan" | "medinan",
    ayahCount: row.ayah_count,
  };
}

type AyahRow = {
  id: number;
  ayah_number_in_surah: number;
  ayah_number_global: number;
  juz_number: number | null;
  page_number: number | null;
  arabic_text: string;
};

type TranslationRow = { ayah_id: number; translation_text: string };
type TransliterationRow = { ayah_id: number; text: string };
type TajwidRow = { ayah_id: number; markup_payload: TajwidSegment[] };
type AudioRow = { ayah_id: number; reciter_id: string; file_url: string; duration_ms: number | null };

function buildAyah(
  ayah: AyahRow,
  surahNumber: number,
  translation: TranslationRow | undefined,
  transliteration: TransliterationRow | undefined,
  tajwid: TajwidRow | undefined,
  audio: AudioRow | undefined
): Ayah {
  const id = `${surahNumber}:${ayah.ayah_number_in_surah}`;
  const primaryAudio: AyahAudio = audio
    ? {
        reciterId: audio.reciter_id,
        url: audio.file_url || defaultAudioPath(surahNumber, ayah.ayah_number_in_surah),
        durationMs: audio.duration_ms ?? 0,
      }
    : {
        reciterId: DEFAULT_RECITER_ID,
        url: defaultAudioPath(surahNumber, ayah.ayah_number_in_surah),
        durationMs: 0,
      };
  return {
    id,
    ayahNumber: ayah.ayah_number_in_surah,
    ayahNumberGlobal: ayah.ayah_number_global,
    juz: ayah.juz_number ?? 0,
    page: ayah.page_number ?? 0,
    arabicText: ayah.arabic_text,
    transliteration: transliteration?.text ?? "",
    translationBosnian: translation?.translation_text ?? "",
    tajwidSegments: tajwid?.markup_payload ?? [],
    audio: primaryAudio,
  };
}

export async function fetchSurahsFromDb(): Promise<SurahSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("surahs")
    .select("surah_number, slug, name_arabic, name_latin, name_bosnian, revelation_type, ayah_count")
    .order("surah_number", { ascending: true });
  if (error) {
    throw new Error(`Failed to fetch surahs: ${error.message} (code: ${error.code ?? "unknown"}). Provjeri da si u Supabaseu pokrenuo SQL za tablice (supabase/RUN_ME_IN_SQL_EDITOR.sql) i seed (npm run seed).`);
  }
  return (data ?? []).map(rowToSurahSummary);
}

export async function fetchSurahDetailFromDb(surahNumber: number): Promise<SurahDetail> {
  const supabase = getSupabaseClient();
  const { data: surahRow, error: surahErr } = await supabase
    .from("surahs")
    .select("id, surah_number, slug, name_arabic, name_latin, name_bosnian, revelation_type, ayah_count")
    .eq("surah_number", surahNumber)
    .maybeSingle();
  if (surahErr || !surahRow) {
    throw new Error(
      surahErr ? `Surah not found: ${surahErr.message}` : "Surah not found"
    );
  }
  const surah = rowToSurahSummary(surahRow);
  const surahId = (surahRow as { id: number }).id;

  const { data: ayahRows, error: ayahErr } = await supabase
    .from("ayahs")
    .select("id, ayah_number_in_surah, ayah_number_global, juz_number, page_number, arabic_text")
    .eq("surah_id", surahId)
    .order("ayah_number_in_surah", { ascending: true });
  if (ayahErr) {
    throw new Error(`Failed to fetch ayahs: ${ayahErr.message}`);
  }
  const ayahsData = (ayahRows ?? []) as AyahRow[];
  const ayahIds = ayahsData.map((a) => a.id);
  if (ayahIds.length === 0) {
    return { surah, ayahs: [] };
  }

  const [
    { data: transRows },
    { data: transLitRows },
    { data: tajwidRows },
    { data: audioRows },
  ] = await Promise.all([
    supabase
      .from("translations")
      .select("ayah_id, translation_text")
      .eq("language_code", "bs")
      .in("ayah_id", ayahIds),
    supabase
      .from("transliterations")
      .select("ayah_id, text")
      .eq("language_code", "standard")
      .in("ayah_id", ayahIds),
    supabase
      .from("tajwid_markup")
      .select("ayah_id, markup_payload")
      .eq("rule_system", "tajwid_5_mvp")
      .in("ayah_id", ayahIds),
    supabase
      .from("audio_tracks")
      .select("ayah_id, reciter_id, file_url, duration_ms")
      .in("ayah_id", ayahIds),
  ]);
  const transByAyah = new Map<number, TranslationRow>();
  (transRows ?? []).forEach((r: TranslationRow) => transByAyah.set(r.ayah_id, r));
  const transLitByAyah = new Map<number, TransliterationRow>();
  (transLitRows ?? []).forEach((r: TransliterationRow) => transLitByAyah.set(r.ayah_id, r));
  const tajwidByAyah = new Map<number, TajwidRow>();
  (tajwidRows ?? []).forEach((r: TajwidRow) => tajwidByAyah.set(r.ayah_id, r));
  const audioByAyah = new Map<number, AudioRow>();
  (audioRows ?? []).forEach((r: AudioRow) => {
    if (!audioByAyah.has(r.ayah_id)) audioByAyah.set(r.ayah_id, r);
  });

  const ayahs: Ayah[] = ayahsData.map((a) =>
    buildAyah(
      a,
      surahNumber,
      transByAyah.get(a.id),
      transLitByAyah.get(a.id),
      tajwidByAyah.get(a.id),
      audioByAyah.get(a.id)
    )
  );
  return { surah, ayahs };
}
