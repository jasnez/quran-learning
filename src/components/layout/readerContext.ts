import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";

/** What the global header shows on a reading screen instead of the brand. */
export type ReaderContext = {
  kind: "surah" | "juz" | "learn";
  title: string;
  titleArabic?: string;
  backHref: string;
  /** Name of the back link. */
  backLabel: string;
  /** Number of ayahs, for the "3/7" counter; a juz has none. */
  total?: number;
};

type RouteParams = Record<string, string | string[] | undefined> | null | undefined;

const SURAHS = surahsData as SurahSummary[];
const JUZ_COUNT = 30;

/** A whole number in the parameter, or null ("1.5", "abc", "" and a missing one are not). */
function wholeNumber(value: string | string[] | undefined): number | null {
  const text = Array.isArray(value) ? value[0] : value;
  return text !== undefined && /^\d+$/.test(text) ? Number(text) : null;
}

/**
 * The reading screen behind a route, or null for every other route.
 *
 * Takes the route segment, never the URL: the static 404.html is served for unknown URLs
 * (/surah/115), where the URL says "surah" but the page is the not-found page; reading the URL
 * there breaks hydration (QA P0). A number that is not a real surah or juz is null as well.
 */
export function readerContext(segment: string | null, params: RouteParams): ReaderContext | null {
  if (segment === "juz") {
    const juz = wholeNumber(params?.juzId);
    if (juz === null || juz < 1 || juz > JUZ_COUNT) return null;
    return {
      kind: "juz",
      title: `Džuz ${juz}`,
      backHref: "/surahs?view=juz",
      backLabel: "Nazad na sve džuzeve",
    };
  }
  if (segment !== "surah" && segment !== "learn") return null;

  const number = wholeNumber(params?.surahId);
  const surah = number === null ? undefined : SURAHS.find((s) => s.surahNumber === number);
  if (!surah) return null;

  const shared = { title: surah.nameLatin, titleArabic: surah.nameArabic, total: surah.ayahCount };
  return segment === "surah"
    ? { kind: "surah", ...shared, backHref: "/surahs", backLabel: "Nazad na sve sure" }
    : { kind: "learn", ...shared, backHref: `/surah/${surah.surahNumber}`, backLabel: "Nazad na suru" };
}
