import { describe, it, expect } from "vitest";
import {
  mapSurahToRow,
  mapAyahToRow,
  mapTranslationToRow,
  mapTransliterationToRow,
  mapTajwidMarkupToRow,
  mapReciterToRow,
  mapAudioTrackToRow,
  type SurahJson,
  type AyahJson,
  type ReciterJson,
} from "../transform";

describe("seed transform", () => {
  const sampleSurah: SurahJson = {
    id: "1",
    surahNumber: 1,
    slug: "al-fatiha",
    nameArabic: "الفاتحة",
    nameLatin: "Al-Fatihah",
    nameBosnian: "Al-Fatiha",
    revelationType: "meccan",
    ayahCount: 7,
  };

  const sampleAyah: AyahJson = {
    id: "1:1",
    ayahNumber: 1,
    ayahNumberGlobal: 1,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    transliteration: "Bismi Allahi arrahmani arraheem",
    translationBosnian: "U ime Allaha, Milostivog, Samilosnog!",
    tajwidSegments: [{ text: "بِسْمِ ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "/audio/001001.mp3", durationMs: 5000 },
  };

  const sampleReciter: ReciterJson = {
    id: "mishary-alafasy",
    name: "Mishary Alafasy",
    arabicName: "مشاري بن راشد العفاسي",
    isDefault: true,
  };

  describe("mapSurahToRow", () => {
    it("maps surah JSON to surahs table row", () => {
      const row = mapSurahToRow(sampleSurah);
      expect(row).toEqual({
        surah_number: 1,
        slug: "al-fatiha",
        name_arabic: "الفاتحة",
        name_latin: "Al-Fatihah",
        name_bosnian: "Al-Fatiha",
        revelation_type: "meccan",
        ayah_count: 7,
        order_in_mushaf: 1,
        description_short: null,
      });
    });
  });

  describe("mapAyahToRow", () => {
    it("maps ayah JSON to ayahs table row with given surah_id", () => {
      const row = mapAyahToRow(sampleAyah, 42);
      expect(row).toEqual({
        surah_id: 42,
        ayah_number_in_surah: 1,
        ayah_number_global: 1,
        juz_number: 1,
        page_number: 1,
        hizb_number: null,
        arabic_text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
      });
    });
  });

  describe("mapTranslationToRow", () => {
    it("maps ayah to translations row (bs, Besim Korkut)", () => {
      const row = mapTranslationToRow(sampleAyah, 100);
      expect(row).toEqual({
        ayah_id: 100,
        language_code: "bs",
        translator_name: "Besim Korkut",
        translation_text: "U ime Allaha, Milostivog, Samilosnog!",
        is_primary: true,
      });
    });
  });

  describe("mapTransliterationToRow", () => {
    it("maps ayah to transliterations row", () => {
      const row = mapTransliterationToRow(sampleAyah, 100);
      expect(row).toEqual({
        ayah_id: 100,
        language_code: "standard",
        text: "Bismi Allahi arrahmani arraheem",
        is_primary: true,
      });
    });
  });

  describe("mapTajwidMarkupToRow", () => {
    it("maps tajwidSegments into markup_payload", () => {
      const row = mapTajwidMarkupToRow(sampleAyah, 100);
      expect(row.ayah_id).toBe(100);
      expect(row.markup_payload).toEqual([{ text: "بِسْمِ ", rule: "normal" }]);
      expect(row.rule_system).toBe("tajwid_5_mvp");
      expect(row.is_primary).toBe(true);
    });
  });

  describe("mapReciterToRow", () => {
    it("maps reciter JSON to reciters table row", () => {
      const row = mapReciterToRow(sampleReciter);
      expect(row).toEqual({
        id: "mishary-alafasy",
        name: "Mishary Alafasy",
        arabic_name: "مشاري بن راشد العفاسي",
        style: null,
        country: null,
        is_active: true,
        audio_base_url: null,
      });
    });
    it("handles missing arabicName", () => {
      const row = mapReciterToRow({ id: "x", name: "X" });
      expect(row.arabic_name).toBeNull();
    });
  });

  describe("mapAudioTrackToRow", () => {
    it("maps ayah.audio to audio_tracks row", () => {
      const row = mapAudioTrackToRow(sampleAyah, 100);
      expect(row).toEqual({
        ayah_id: 100,
        reciter_id: "mishary-alafasy",
        file_url: "/audio/001001.mp3",
        duration_ms: 5000,
        format: "mp3",
        is_primary: true,
      });
    });
    it("handles missing durationMs", () => {
      const ayahNoDuration: AyahJson = {
        ...sampleAyah,
        audio: { reciterId: "r", url: "/x.mp3", durationMs: 0 },
      };
      const row = mapAudioTrackToRow(ayahNoDuration, 1);
      expect(row.duration_ms).toBe(0);
    });
  });
});
