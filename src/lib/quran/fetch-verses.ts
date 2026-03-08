import type { Ayah } from "@/types/quran";
import {
  QURAN_API_BASE,
  TRANSLITERATION_RESOURCE_ID,
  BOSNIAN_KORKUT_TRANSLATION_ID,
  AYAH_COUNT_PER_SURAH,
} from "./constants";
import type { QuranApiVersesResponse } from "./api-types";

const VERSE_FIELDS = "text_uthmani";
const PER_PAGE = 50;

/** Comma-separated translation IDs: transliteration (57) + Besim Korkut Bosnian (126) */
const TRANSLATION_IDS = `${TRANSLITERATION_RESOURCE_ID},${BOSNIAN_KORKUT_TRANSLATION_ID}`;

/**
 * Fetches verses for a chapter from Quran.com API with Arabic text,
 * transliteration (resource_id 57), and Bosnian translation by Besim Korkut (resource_id 126).
 */
export async function fetchVersesByChapter(
  chapterNumber: number
): Promise<Ayah[]> {
  if (chapterNumber < 1 || chapterNumber > 114) {
    throw new RangeError("chapterNumber must be between 1 and 114");
  }

  const allAyahs: Ayah[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const base = QURAN_API_BASE.replace(/\/$/, "");
    const url = new URL(`${base}/verses/by_chapter/${chapterNumber}`);
    url.searchParams.set("translations", TRANSLATION_IDS);
    url.searchParams.set("fields", VERSE_FIELDS);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(
        `Quran API error: ${res.status} ${res.statusText} for chapter ${chapterNumber}`
      );
    }

    const data: QuranApiVersesResponse = await res.json();
    const mappedAyahs = mapVersesToAyahs(data.verses, chapterNumber);
    allAyahs.push(...mappedAyahs);

    hasMore = data.pagination.next_page != null;
    page += 1;
  }

  return allAyahs;
}

function getAyahNumberGlobal(chapterNumber: number, verseNumber: number): number {
  let sum = 0;
  for (let i = 0; i < chapterNumber - 1; i++) {
    sum += AYAH_COUNT_PER_SURAH[i];
  }
  return sum + verseNumber;
}

function mapVersesToAyahs(verses: QuranApiVersesResponse["verses"], chapterNumber: number): Ayah[] {
  return verses.map((v) => {
    const transliteration =
      v.translations?.find((t) => t.resource_id === TRANSLITERATION_RESOURCE_ID)
        ?.text ?? "";
    const translationBosnian =
      v.translations?.find((t) => t.resource_id === BOSNIAN_KORKUT_TRANSLATION_ID)
        ?.text ?? "";
    const ayahNumberGlobal = getAyahNumberGlobal(chapterNumber, v.verse_number);
    return {
      id: v.verse_key,
      ayahNumber: v.verse_number,
      ayahNumberGlobal,
      juz: v.juz_number,
      page: v.page_number,
      arabicText: v.text_uthmani ?? "",
      transliteration,
      translationBosnian: stripHtml(translationBosnian),
      tajwidSegments: [],
      audio: {
        reciterId: "",
        url: "",
        durationMs: 0,
      },
    };
  });
}

/** API may return translation text with HTML tags (e.g. footnotes); strip for plain display */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}
