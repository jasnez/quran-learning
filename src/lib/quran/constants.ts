/**
 * Quran.com API v4 base URL.
 * Transliteration is provided by translation resource_id 57 (full-ayah).
 * @see https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/verses-by-chapter-number
 */
export const QURAN_API_BASE = "https://api.quran.com/api/v4";

/** Resource ID for full-ayah transliteration (English) on Quran.com */
export const TRANSLITERATION_RESOURCE_ID = 57;

/** Resource ID for Bosnian translation by Besim Korkut on Quran.com */
export const BOSNIAN_KORKUT_TRANSLATION_ID = 126;

/** Number of ayahs per surah (1–114) for computing global verse index */
export const AYAH_COUNT_PER_SURAH: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54,
  45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62,
  55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28,
  20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
