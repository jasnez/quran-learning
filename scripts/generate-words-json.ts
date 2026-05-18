/**
 * Generates src/data/words/NNN-slug.json for all 114 surahs from Quran.com API
 * (verse words + Mishary Alafasy chapter audio segments with word-level timestamps).
 *
 * Output format matches the existing Al-Fatiha file:
 *   { ayahNumberGlobal, wordOrder, textArabic, transliteration, translationShort,
 *     startTimeMs, endTimeMs, tajwidRule }
 *
 * Timings are chapter-relative (in ms from start of chapter audio).
 * normalizeWordsToAyahRelative() at runtime converts them to ayah-relative.
 *
 * By default, skips surahs that already have a JSON file (preserves Al-Fatiha
 * which may have been hand-tuned). Use --force to overwrite all.
 *
 * Run examples:
 *   npx tsx scripts/generate-words-json.ts                 # all missing
 *   npx tsx scripts/generate-words-json.ts --force         # all 114, overwrite
 *   npx tsx scripts/generate-words-json.ts --surah 36      # one surah only
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SURAHS_PATH = path.join(ROOT, "src", "data", "surahs.json");
const AYAHS_DIR = path.join(ROOT, "src", "data", "ayahs");
const WORDS_DIR = path.join(ROOT, "src", "data", "words");

const QURAN_API = "https://api.quran.com/api/v4";
const AUDIO_API = "https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files";
const DELAY_MS = 300;

type SurahMeta = {
  surahNumber: number;
  slug: string;
  ayahCount: number;
};

interface ApiWord {
  position: number;
  char_type_name: "word" | "end" | "pause";
  text_uthmani: string;
  translation?: { text: string };
  transliteration?: { text: string | null };
}

interface ApiVerse {
  verse_number: number;
  verse_key: string;
  words: ApiWord[];
}

interface ApiVerseResponse {
  verses: ApiVerse[];
  pagination: { next_page: number | null };
}

interface ApiSegment {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  segments?: number[][];
}

interface ApiAudioFile {
  audio_url: string;
  verse_timings?: ApiSegment[];
  timestamps?: ApiSegment[];
}

interface ApiAudioResponse {
  audio_files?: ApiAudioFile[];
  audio_file?: ApiAudioFile;
}

interface OutputWord {
  ayahNumberGlobal: number;
  wordOrder: number;
  textArabic: string;
  transliteration: string;
  translationShort: string;
  startTimeMs: number;
  endTimeMs: number;
  tajwidRule: "normal";
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchVerses(surahNumber: number): Promise<ApiVerse[]> {
  const all: ApiVerse[] = [];
  let page = 1;
  while (true) {
    const url = new URL(`${QURAN_API}/verses/by_chapter/${surahNumber}`);
    url.searchParams.set("language", "en");
    url.searchParams.set("words", "true");
    url.searchParams.set("word_fields", "text_uthmani");
    url.searchParams.set("per_page", "300");
    url.searchParams.set("page", String(page));
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`verses fetch failed (surah ${surahNumber} page ${page}): ${res.status}`);
    }
    const data = (await res.json()) as ApiVerseResponse;
    all.push(...data.verses);
    if (data.pagination.next_page == null) break;
    page++;
    await delay(DELAY_MS);
  }
  return all;
}

async function fetchSegments(surahNumber: number): Promise<Map<string, ApiSegment>> {
  const url = `${AUDIO_API}?chapter=${surahNumber}&segments=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`audio fetch failed (surah ${surahNumber}): ${res.status}`);
  }
  const data = (await res.json()) as ApiAudioResponse;
  const audioFile = data.audio_files?.[0] ?? data.audio_file;
  if (!audioFile) {
    throw new Error(`no audio file in response for surah ${surahNumber}`);
  }
  const timings = audioFile.timestamps ?? audioFile.verse_timings ?? [];
  const map = new Map<string, ApiSegment>();
  for (const t of timings) {
    map.set(t.verse_key, t);
  }
  return map;
}

function loadAyahGlobalMap(surahNumber: number, slug: string): Map<number, number> {
  const padded = String(surahNumber).padStart(3, "0");
  const filePath = path.join(AYAHS_DIR, `${padded}-${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as {
    ayahs: { ayahNumber: number; ayahNumberGlobal: number }[];
  };
  const map = new Map<number, number>();
  for (const a of data.ayahs) {
    map.set(a.ayahNumber, a.ayahNumberGlobal);
  }
  return map;
}

async function generateSurah(surah: SurahMeta): Promise<OutputWord[]> {
  const [verses, segMap] = await Promise.all([
    fetchVerses(surah.surahNumber),
    fetchSegments(surah.surahNumber),
  ]);
  const ayahGlobalMap = loadAyahGlobalMap(surah.surahNumber, surah.slug);
  const out: OutputWord[] = [];

  for (const verse of verses) {
    const ayahNumberGlobal = ayahGlobalMap.get(verse.verse_number);
    if (ayahNumberGlobal == null) {
      console.warn(`  ! missing ayahNumberGlobal for ${verse.verse_key}, skipping`);
      continue;
    }
    const seg = segMap.get(verse.verse_key);
    const wordSegments = seg?.segments ?? [];
    const segByPos = new Map<number, { startMs: number; endMs: number }>();
    for (const s of wordSegments) {
      if (Array.isArray(s) && s.length >= 3) {
        segByPos.set(s[0], { startMs: s[1], endMs: s[2] });
      }
    }

    const wordsOnly = verse.words.filter((w) => w.char_type_name === "word");
    let wordOrder = 0;
    for (const w of wordsOnly) {
      wordOrder++;
      const timing = segByPos.get(w.position);
      const startMs = timing?.startMs ?? seg?.timestamp_from ?? 0;
      const endMs = timing?.endMs ?? seg?.timestamp_to ?? 0;
      out.push({
        ayahNumberGlobal,
        wordOrder,
        textArabic: w.text_uthmani,
        transliteration: w.transliteration?.text ?? "",
        translationShort: w.translation?.text ?? "",
        startTimeMs: startMs,
        endTimeMs: endMs,
        tajwidRule: "normal",
      });
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const surahArgIdx = args.indexOf("--surah");
  const onlySurah =
    surahArgIdx >= 0 && args[surahArgIdx + 1] ? parseInt(args[surahArgIdx + 1], 10) : null;

  const surahs = JSON.parse(fs.readFileSync(SURAHS_PATH, "utf-8")) as SurahMeta[];
  if (!fs.existsSync(WORDS_DIR)) {
    fs.mkdirSync(WORDS_DIR, { recursive: true });
  }

  const todo = onlySurah ? surahs.filter((s) => s.surahNumber === onlySurah) : surahs;
  if (todo.length === 0) {
    console.error(`No surah ${onlySurah} found`);
    process.exit(1);
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const surah of todo) {
    const padded = String(surah.surahNumber).padStart(3, "0");
    const outPath = path.join(WORDS_DIR, `${padded}-${surah.slug}.json`);
    if (!force && fs.existsSync(outPath)) {
      skipped++;
      continue;
    }
    process.stdout.write(`[${surah.surahNumber}/114] ${surah.slug}... `);
    try {
      const words = await generateSurah(surah);
      fs.writeFileSync(outPath, JSON.stringify(words, null, 2) + "\n");
      success++;
      console.log(`✓ ${words.length} words`);
    } catch (e) {
      failed++;
      console.log(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
    await delay(DELAY_MS);
  }

  console.log(`\nDone. ${success} generated, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
