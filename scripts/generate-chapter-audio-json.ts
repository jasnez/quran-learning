/**
 * Generates public/data/chapter-audio/NNN-slug.json for all 114 surahs.
 *
 * Each file contains the chapter audio URL and verse timestamps with word-level
 * segments. Used by word-by-word mode in chapter-audio playback (entire surah is
 * one MP3, with timing offsets per verse and word).
 *
 * Output is in /public so client can fetch via /data/chapter-audio/... in
 * static-exported builds (no /api/quran/chapter-audio proxy needed).
 *
 * Run: npm run generate:chapter-audio
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SURAHS_PATH = path.join(ROOT, "src", "data", "surahs.json");
const OUT_DIR = path.join(ROOT, "public", "data", "chapter-audio");

const AUDIO_API = "https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files";
const DELAY_MS = 300;

type SurahMeta = { surahNumber: number; slug: string };

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

interface OutputSegment {
  wordPosition: number;
  startMs: number;
  endMs: number;
}

interface OutputTimestamp {
  verseKey: string;
  timestampFrom: number;
  timestampTo: number;
  segments: OutputSegment[];
}

interface OutputChapterAudio {
  chapterId: number;
  audioUrl: string;
  timestamps: OutputTimestamp[];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSurahAudio(surahNumber: number): Promise<OutputChapterAudio> {
  const url = `${AUDIO_API}?chapter=${surahNumber}&segments=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`audio fetch failed (surah ${surahNumber}): ${res.status}`);
  }
  const data = (await res.json()) as ApiAudioResponse;
  const audioFile = data.audio_files?.[0] ?? data.audio_file;
  if (!audioFile?.audio_url) {
    throw new Error(`no audio_url in response for surah ${surahNumber}`);
  }
  const rawTimings = audioFile.timestamps ?? audioFile.verse_timings ?? [];
  const timestamps: OutputTimestamp[] = rawTimings.map((t) => ({
    verseKey: t.verse_key,
    timestampFrom: t.timestamp_from,
    timestampTo: t.timestamp_to,
    segments: (t.segments ?? [])
      .filter(
        (s): s is number[] => Array.isArray(s) && s.length >= 3,
      )
      .map((s) => ({
        wordPosition: s[0],
        startMs: s[1],
        endMs: s[2],
      })),
  }));
  return {
    chapterId: surahNumber,
    audioUrl: audioFile.audio_url,
    timestamps,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const surahArgIdx = args.indexOf("--surah");
  const onlySurah =
    surahArgIdx >= 0 && args[surahArgIdx + 1]
      ? parseInt(args[surahArgIdx + 1], 10)
      : null;

  const surahs = JSON.parse(fs.readFileSync(SURAHS_PATH, "utf-8")) as SurahMeta[];
  fs.mkdirSync(OUT_DIR, { recursive: true });

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
    const outPath = path.join(OUT_DIR, `${padded}-${surah.slug}.json`);
    if (!force && fs.existsSync(outPath)) {
      skipped++;
      continue;
    }
    process.stdout.write(`[${surah.surahNumber}/114] ${surah.slug}... `);
    try {
      const data = await fetchSurahAudio(surah.surahNumber);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
      success++;
      console.log(`✓ ${data.timestamps.length} verse timings`);
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
