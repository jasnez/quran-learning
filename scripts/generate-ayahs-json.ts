/**
 * Generates ayah JSON files for all 114 surahs with transliteration and Bosnian
 * translation from Quran.com API. Skips surahs that already have a JSON file
 * unless --force is passed.
 *
 * Run from project root: npx tsx scripts/generate-ayahs-json.ts
 * Or: node --import tsx scripts/generate-ayahs-json.ts
 *
 * Data: Quran.com API v4 (transliteration resource 57, Bosnian Korkut 126).
 * Tajwid: cpfair/quran-tajweed for surahs 2–111.
 */

import * as fs from "fs";
import * as path from "path";

/** Run from project root (quran-learning) */
const ROOT = process.cwd();

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const TRANSLITERATION_RESOURCE_ID = 57;
const BOSNIAN_KORKUT_TRANSLATION_ID = 126;
const TAJWEED_JSON_URL =
  "https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json";
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

type CpfairAnnotation = { rule: string; start: number; end: number };
type CpfairEntry = { surah: number; ayah: number; annotations: CpfairAnnotation[] };
type TajwidRule = "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah";
type TajwidSegment = { text: string; rule: TajwidRule };

function mapRule(rule: string): TajwidRule {
  const r = rule.toLowerCase();
  if (r.startsWith("madd_")) return "mad";
  if (r === "ghunnah" || r === "idghaam_ghunnah") return "ghunnah";
  if (r === "ikhfa" || r === "ikhfa_shafawi") return "ikhfa";
  if (r === "qalqalah") return "qalqalah";
  return "normal";
}

function buildTajwidSegments(
  arabicText: string,
  annotations: CpfairAnnotation[]
): TajwidSegment[] {
  const chars = Array.from(arabicText);
  const len = chars.length;
  if (len === 0) return [{ text: "", rule: "normal" }];
  if (annotations.length === 0) return [{ text: arabicText, rule: "normal" }];
  const outOfRange = annotations.some((a) => a.start < 0 || a.end > len);
  if (outOfRange) return [{ text: arabicText, rule: "normal" }];

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: TajwidSegment[] = [];
  let pos = 0;

  for (const ann of sorted) {
    const start = Math.max(0, Math.min(ann.start, len));
    const end = Math.max(start, Math.min(ann.end, len));
    if (start > pos) {
      const gapText = chars.slice(pos, start).join("");
      if (gapText) segments.push({ text: gapText, rule: "normal" });
    }
    if (end > start) {
      const segmentText = chars.slice(start, end).join("");
      if (segmentText)
        segments.push({ text: segmentText, rule: mapRule(ann.rule) });
    }
    pos = end;
  }
  if (pos < len) {
    const tail = chars.slice(pos).join("");
    if (tail) segments.push({ text: tail, rule: "normal" });
  }

  const reconstructedLen = segments.reduce(
    (sum, s) => sum + Array.from(s.text).length,
    0
  );
  if (reconstructedLen !== len) return [{ text: arabicText, rule: "normal" }];

  return segments.length > 0 ? segments : [{ text: arabicText, rule: "normal" }];
}

function getAnnotationsForVerse(
  data: CpfairEntry[],
  surah: number,
  ayah: number
): CpfairAnnotation[] {
  const entry = data.find((e) => e.surah === surah && e.ayah === ayah);
  return entry?.annotations ?? [];
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

async function fetchTajweedData(): Promise<CpfairEntry[]> {
  const res = await fetch(TAJWEED_JSON_URL);
  if (!res.ok) throw new Error(`Tajweed fetch failed: ${res.status}`);
  return (await res.json()) as CpfairEntry[];
}

async function fetchVersesForChapter(
  chapterNumber: number,
  tajweedData: CpfairEntry[]
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
  tajweedData: CpfairEntry[]
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
    const annotations = getAnnotationsForVerse(
      tajweedData,
      chapterNumber,
      v.verse_number
    );
    const tajwidSegments = buildTajwidSegments(arabicText, annotations);

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

async function main(): Promise<void> {
  const force =
    process.argv.includes("--force") || process.argv.includes("-f");

  const surahsPath = path.join(ROOT, "src", "data", "surahs.json");
  const surahs: SurahSummary[] = JSON.parse(
    fs.readFileSync(surahsPath, "utf-8")
  );

  const ayahsDir = path.join(ROOT, "src", "data", "ayahs");
  if (!fs.existsSync(ayahsDir)) {
    fs.mkdirSync(ayahsDir, { recursive: true });
  }

  console.log("Fetching tajweed data...");
  const tajweedData = await fetchTajweedData();
  console.log(`Loaded tajweed for ${tajweedData.length} verses.`);

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
      const verses = await fetchVersesForChapter(surah.surahNumber, tajweedData);
      const ayahs = mapVersesToAyahs(verses, surah.surahNumber, tajweedData);

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
    `\nDone. Generated: ${generated}, skipped (existing): ${skipped}.`
  );
}

main();
