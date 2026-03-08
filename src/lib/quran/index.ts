// Quran utilities – Quran.com API integration (incl. transliteration)

export {
  QURAN_API_BASE,
  TRANSLITERATION_RESOURCE_ID,
  BOSNIAN_KORKUT_TRANSLATION_ID,
  AYAH_COUNT_PER_SURAH,
} from "./constants";
export type { QuranApiVerse, QuranApiVersesResponse } from "./api-types";
export { fetchVersesByChapter } from "./fetch-verses";
export { tajwidRuleClasses, tajwidRuleLabels } from "./tajwidStyles";
