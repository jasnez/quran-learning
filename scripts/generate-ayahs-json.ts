/**
 * Generates ayah JSON files for all 114 surahs with transliteration and Bosnian
 * translation from Quran.com API. Skips surahs that already have a JSON file
 * unless --force is passed.
 *
 * Run from project root: npx tsx scripts/generate-ayahs-json.ts
 * Or: node --import tsx scripts/generate-ayahs-json.ts
 *
 * Data: Quran.com API v4 (transliteration resource 57, Bosnian Korkut 126).
 * Tajwid: cpfair/quran-tajweed annotations, remapped onto the displayed text
 * (see src/lib/quran/tajwidAlignment.ts).
 *
 * Recompute only the tajwidSegments of the existing files (no Quran.com calls):
 *   npx tsx scripts/generate-ayahs-json.ts --tajwid-only
 */

import * as fs from "fs";
import * as path from "path";
import {
  buildAlignedTajwidSegments,
  type CpfairAnnotation,
} from "../src/lib/quran/tajwidAlignment";

/** Run from project root (quran-learning) */
const ROOT = process.cwd();

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const TRANSLITERATION_RESOURCE_ID = 57;
const BOSNIAN_KORKUT_TRANSLATION_ID = 126;
const TAJWEED_JSON_URL =
  "https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json";
/** The cpfair indices refer to this exact copy of the Tanzil text (per the cpfair README), not to Quran.com text. */
const TAJWEED_BASE_TEXT_URL =
  "https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt";
const TOTAL_AYAHS = 6236;
const VERSE_FIELDS = "text_uthmani";
const PER_PAGE = 50;

const AYAH_COUNT_PER_SURAH: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54,
  45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62,
  55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28,
  20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15,
  21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

type QuranApiTranslation = { id: number; resource_id: number; text: string };
type QuranApiVerse = {
  id: number;
  verse_number: number;
  verse_key: string;
  page_number: number;
  juz_number: number;
  text_uthmani?: string;
  translations?: QuranApiTranslation[];
};
type QuranApiResponse = {
  verses: QuranApiVerse[];
  pagination: { next_page: number | null };
};

type CpfairEntry = { surah: number; ayah: number; annotations: CpfairAnnotation[] };
type TajwidRule = "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah";
type TajwidSegment = { text: string; rule: TajwidRule };

/** cpfair annotations plus the base text their indices refer to, keyed by verse key ("2:255"). */
type TajweedSource = {
  annotations: Map<string, CpfairAnnotation[]>;
  baseTexts: Map<string, string>;
};

type TajwidStats = { unmappedAnnotations: number };

function tajwidSegmentsFor(
  source: TajweedSource,
  verseKey: string,
  arabicText: string,
  stats: TajwidStats
): TajwidSegment[] {
  const baseText = source.baseTexts.get(verseKey);
  if (baseText == null) throw new Error(`No tajweed base text for ${verseKey}`);
  const { segments, unmappedAnnotations } = buildAlignedTajwidSegments(
    baseText,
    arabicText,
    source.annotations.get(verseKey) ?? []
  );
  stats.unmappedAnnotations += unmappedAnnotations;
  return segments as TajwidSegment[];
}

const LETTERLESS_SEGMENT = /^[\u064B-\u0652\u0640\s]+$/u;

/** A rule color on harakat/tatweel only means indices were applied to the wrong text: fail loudly. */
function assertTajwidOnLetters(
  ayahs: Array<{ id: string; tajwidSegments: TajwidSegment[] }>
): void {
  const offenders = ayahs.flatMap((a) =>
    a.tajwidSegments
      .filter((s) => s.rule !== "normal" && LETTERLESS_SEGMENT.test(s.text))
      .map(() => a.id)
  );
  if (offenders.length > 0) {
    throw new Error(
      `Tajwid colors landed on harakat/tatweel only in ${offenders.length} segment(s), e.g. ${offenders.slice(0, 5).join(", ")}`
    );
  }
}

function getAyahNumberGlobal(chapterNumber: number, verseNumber: number): number {
  let sum = 0;
  for (let i = 0; i < chapterNumber - 1; i++) {
    sum += AYAH_COUNT_PER_SURAH[i];
  }
  return sum + verseNumber;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

async function fetchTajweedSource(): Promise<TajweedSource> {
  const [annotationsRes, baseTextRes] = await Promise.all([
    fetch(TAJWEED_JSON_URL),
    fetch(TAJWEED_BASE_TEXT_URL),
  ]);
  if (!annotationsRes.ok) throw new Error(`Tajweed annotations fetch failed: ${annotationsRes.status}`);
  if (!baseTextRes.ok) throw new Error(`Tajweed base text fetch failed: ${baseTextRes.status}`);

  const entries = (await annotationsRes.json()) as CpfairEntry[];
  const baseTexts = new Map<string, string>();
  for (const line of (await baseTextRes.text()).split(/\r?\n/)) {
    const match = line.match(/^(\d+)\|(\d+)\|(.*)$/);
    if (match) baseTexts.set(`${match[1]}:${match[2]}`, match[3]);
  }
  if (baseTexts.size !== TOTAL_AYAHS) {
    throw new Error(`Tajweed base text has ${baseTexts.size} ayahs, expected ${TOTAL_AYAHS}`);
  }

  // The annotations are only valid for this exact text: every hamzat al-wasl must sit on U+0671.
  let anchors = 0;
  const offAnchors: string[] = [];
  for (const entry of entries) {
    const chars = Array.from(baseTexts.get(`${entry.surah}:${entry.ayah}`) ?? "");
    for (const annotation of entry.annotations) {
      if (annotation.rule !== "hamzat_wasl") continue;
      anchors++;
      if (chars.slice(annotation.start, annotation.end).join("") !== "\u0671") {
        offAnchors.push(`${entry.surah}:${entry.ayah}@${annotation.start}`);
      }
    }
  }
  if (anchors === 0 || offAnchors.length > 0) {
    throw new Error(
      `Tajweed annotations do not match the base text: ${offAnchors.length}/${anchors} hamzat al-wasl anchors off (e.g. ${offAnchors.slice(0, 3).join(", ")})`
    );
  }

  return {
    annotations: new Map(entries.map((e) => [`${e.surah}:${e.ayah}`, e.annotations])),
    baseTexts,
  };
}

async function fetchVersesForChapter(
  chapterNumber: number
): Promise<QuranApiVerse[]> {
  const allVerses: QuranApiVerse[] = [];
  let page = 1;
  let hasMore = true;
  const translationIds = `${TRANSLITERATION_RESOURCE_ID},${BOSNIAN_KORKUT_TRANSLATION_ID}`;

  while (hasMore) {
    const url = new URL(
      `${QURAN_API_BASE.replace(/\/$/, "")}/verses/by_chapter/${chapterNumber}`
    );
    url.searchParams.set("translations", translationIds);
    url.searchParams.set("fields", VERSE_FIELDS);
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(
        `Quran API error: ${res.status} ${res.statusText} for chapter ${chapterNumber}`
      );
    }

    const data: QuranApiResponse = await res.json();
    allVerses.push(...data.verses);
    hasMore = data.pagination.next_page != null;
    page += 1;
  }

  return allVerses;
}

function mapVersesToAyahs(
  verses: QuranApiVerse[],
  chapterNumber: number,
  tajweedSource: TajweedSource,
  tajwidStats: TajwidStats
): Array<{
  id: string;
  ayahNumber: number;
  ayahNumberGlobal: number;
  juz: number;
  page: number;
  arabicText: string;
  transliteration: string;
  translationBosnian: string;
  tajwidSegments: TajwidSegment[];
  audio: { reciterId: string; url: string; durationMs: number };
}> {
  const surahPad = String(chapterNumber).padStart(3, "0");
  return verses.map((v) => {
    const transliteration =
      v.translations?.find((t) => t.resource_id === TRANSLITERATION_RESOURCE_ID)
        ?.text ?? "";
    const translationBosnian =
      v.translations?.find(
        (t) => t.resource_id === BOSNIAN_KORKUT_TRANSLATION_ID
      )?.text ?? "";
    const ayahNumberGlobal = getAyahNumberGlobal(chapterNumber, v.verse_number);
    const versePad = String(v.verse_number).padStart(3, "0");
    const arabicText = v.text_uthmani ?? "";
    const tajwidSegments = tajwidSegmentsFor(tajweedSource, v.verse_key, arabicText, tajwidStats);

    return {
      id: v.verse_key,
      ayahNumber: v.verse_number,
      ayahNumberGlobal,
      juz: v.juz_number,
      page: v.page_number,
      arabicText,
      transliteration,
      translationBosnian: stripHtml(translationBosnian),
      tajwidSegments,
      audio: {
        reciterId: "mishary-alafasy",
        url: `/audio/mishary-alafasy/${surahPad}${versePad}.mp3`,
        durationMs: 0,
      },
    };
  });
}

type SurahSummary = {
  id: string;
  surahNumber: number;
  slug: string;
  nameArabic: string;
  nameLatin: string;
  nameBosnian: string;
  revelationType: string;
  ayahCount: number;
};

type AyahFile = {
  ayahs: Array<{ id: string; arabicText: string; tajwidSegments: TajwidSegment[] }>;
};

/** Rewrites only tajwidSegments of the existing files, keeping every other field as it is. */
function realignExistingTajwid(
  ayahsDir: string,
  surahs: SurahSummary[],
  tajweedSource: TajweedSource
): void {
  const tajwidStats: TajwidStats = { unmappedAnnotations: 0 };
  for (const surah of surahs) {
    const padded = String(surah.surahNumber).padStart(3, "0");
    const filePath = path.join(ayahsDir, `${padded}-${surah.slug}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AyahFile;
    for (const ayah of data.ayahs) {
      ayah.tajwidSegments = tajwidSegmentsFor(tajweedSource, ayah.id, ayah.arabicText, tajwidStats);
    }
    assertTajwidOnLetters(data.ayahs);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  console.log(
    `Re-aligned tajwid for ${surahs.length} surahs (${tajwidStats.unmappedAnnotations} annotations have no counterpart in the displayed text).`
  );
}

async function main(): Promise<void> {
  const force =
    process.argv.includes("--force") || process.argv.includes("-f");
  const tajwidOnly = process.argv.includes("--tajwid-only");

  const surahsPath = path.join(ROOT, "src", "data", "surahs.json");
  const surahs: SurahSummary[] = JSON.parse(
    fs.readFileSync(surahsPath, "utf-8")
  );

  const ayahsDir = path.join(ROOT, "src", "data", "ayahs");
  if (!fs.existsSync(ayahsDir)) {
    fs.mkdirSync(ayahsDir, { recursive: true });
  }

  console.log("Fetching tajweed annotations and base text...");
  const tajweedSource = await fetchTajweedSource();
  console.log(`Loaded tajweed for ${tajweedSource.annotations.size} verses.`);

  if (tajwidOnly) {
    realignExistingTajwid(ayahsDir, surahs, tajweedSource);
    return;
  }

  const tajwidStats: TajwidStats = { unmappedAnnotations: 0 };
  let generated = 0;
  let skipped = 0;

  for (const surah of surahs) {
    const padded = String(surah.surahNumber).padStart(3, "0");
    const filename = `${padded}-${surah.slug}.json`;
    const filePath = path.join(ayahsDir, filename);

    if (!force && fs.existsSync(filePath)) {
      skipped++;
      continue;
    }

    process.stdout.write(
      `Surah ${surah.surahNumber}/${surahs.length} (${surah.nameLatin})... `
    );

    try {
      const verses = await fetchVersesForChapter(surah.surahNumber);
      const ayahs = mapVersesToAyahs(verses, surah.surahNumber, tajweedSource, tajwidStats);
      assertTajwidOnLetters(ayahs);

      const output = {
        surah: {
          id: surah.id,
          surahNumber: surah.surahNumber,
          slug: surah.slug,
          nameArabic: surah.nameArabic,
          nameLatin: surah.nameLatin,
          nameBosnian: surah.nameBosnian,
          revelationType: surah.revelationType,
          ayahCount: surah.ayahCount,
        },
        ayahs,
      };

      fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
      console.log(`${ayahs.length} ayahs written.`);
      generated++;
    } catch (err) {
      console.error(`Error: ${err}`);
      throw err;
    }
  }

  console.log(
    `\nDone. Generated: ${generated}, skipped (existing): ${skipped}. Tajweed annotations without a counterpart in the displayed text: ${tajwidStats.unmappedAnnotations}.`
  );
}

main();
