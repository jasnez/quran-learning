/**
 * Pure mapping from app JSON shapes to Supabase row shapes.
 * Used by seed-database.ts; tested in __tests__/transform.test.ts.
 */

export type SurahJson = {
  id: string;
  surahNumber: number;
  slug: string;
  nameArabic: string;
  nameLatin: string;
  nameBosnian: string;
  revelationType: string;
  ayahCount: number;
};

export type TajwidSegmentJson = { text: string; rule: string };
export type AyahAudioJson = { reciterId: string; url: string; durationMs: number };

export type AyahJson = {
  id: string;
  ayahNumber: number;
  ayahNumberGlobal: number;
  juz: number;
  page: number;
  arabicText: string;
  transliteration: string;
  translationBosnian: string;
  tajwidSegments: TajwidSegmentJson[];
  audio: AyahAudioJson;
};

export type ReciterJson = {
  id: string;
  name: string;
  arabicName?: string;
  isDefault?: boolean;
};

/** Row for surahs table (without id, created_at, updated_at). */
export function mapSurahToRow(s: SurahJson) {
  return {
    surah_number: s.surahNumber,
    slug: s.slug,
    name_arabic: s.nameArabic,
    name_latin: s.nameLatin,
    name_bosnian: s.nameBosnian,
    revelation_type: s.revelationType,
    ayah_count: s.ayahCount,
    order_in_mushaf: s.surahNumber,
    description_short: null as string | null,
  };
}

/** Row for ayahs table (surah_id filled by caller). */
export function mapAyahToRow(a: AyahJson, surahId: number) {
  return {
    surah_id: surahId,
    ayah_number_in_surah: a.ayahNumber,
    ayah_number_global: a.ayahNumberGlobal,
    juz_number: a.juz,
    page_number: a.page,
    hizb_number: null as number | null,
    arabic_text: a.arabicText,
  };
}

/** Row for translations table (ayah_id filled by caller). */
export function mapTranslationToRow(a: AyahJson, ayahId: number) {
  return {
    ayah_id: ayahId,
    language_code: "bs",
    translator_name: "Besim Korkut",
    translation_text: a.translationBosnian,
    is_primary: true,
  };
}

/** Row for transliterations table. */
export function mapTransliterationToRow(a: AyahJson, ayahId: number) {
  return {
    ayah_id: ayahId,
    language_code: "standard",
    text: a.transliteration,
    is_primary: true,
  };
}

/** Row for tajwid_markup table (markup_payload = tajwidSegments). */
export function mapTajwidMarkupToRow(a: AyahJson, ayahId: number) {
  return {
    ayah_id: ayahId,
    markup_payload: a.tajwidSegments,
    rule_system: "tajwid_5_mvp",
    is_primary: true,
  };
}

/** Row for reciters table. */
export function mapReciterToRow(r: ReciterJson) {
  return {
    id: r.id,
    name: r.name,
    arabic_name: r.arabicName ?? null,
    style: null as string | null,
    country: null as string | null,
    is_active: true,
    audio_base_url: null as string | null,
  };
}

/** Row for audio_tracks table (ayah_id filled by caller). */
export function mapAudioTrackToRow(a: AyahJson, ayahId: number) {
  const audio = a.audio;
  return {
    ayah_id: ayahId,
    reciter_id: audio.reciterId,
    file_url: audio.url,
    duration_ms: audio.durationMs ?? null,
    format: "mp3",
    is_primary: true,
  };
}
