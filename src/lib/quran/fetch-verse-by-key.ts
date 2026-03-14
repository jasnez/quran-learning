import { QURAN_API_BASE } from "./constants";
import { BOSNIAN_KORKUT_TRANSLATION_ID, TRANSLITERATION_RESOURCE_ID } from "./constants";
import type { QuranApiTranslation } from "./api-types";

export type VerseContent = {
  arabic: string;
  transliteration: string;
  translationBosnian: string;
};

type VerseByKeyResponse = {
  verse: {
    verse_key: string;
    text_uthmani?: string;
    translations?: QuranApiTranslation[];
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Fetches a single verse by key (e.g. "2:201") from Quran.com API with
 * Arabic, transliteration (57), and Bosnian translation by Besim Korkut (126).
 * Used to keep dua translations in sync with surah display.
 */
export async function fetchVerseContentByKey(
  verseKey: string
): Promise<VerseContent> {
  const base = QURAN_API_BASE.replace(/\/$/, "");
  const translations = `${TRANSLITERATION_RESOURCE_ID},${BOSNIAN_KORKUT_TRANSLATION_ID}`;
  const url = new URL(`${base}/verses/by_key/${verseKey}`);
  url.searchParams.set("translations", translations);
  url.searchParams.set("fields", "text_uthmani");

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`Quran API error: ${res.status} ${res.statusText} for verse ${verseKey}`);
  }

  const data = (await res.json()) as VerseByKeyResponse;
  const verse = data.verse;
  const transliteration =
    verse.translations?.find((t) => t.resource_id === TRANSLITERATION_RESOURCE_ID)?.text ?? "";
  const translationBosnian =
    verse.translations?.find((t) => t.resource_id === BOSNIAN_KORKUT_TRANSLATION_ID)?.text ?? "";

  return {
    arabic: verse.text_uthmani ?? "",
    transliteration: stripHtml(transliteration),
    translationBosnian: stripHtml(translationBosnian),
  };
}
