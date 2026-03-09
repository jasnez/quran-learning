/**
 * Seed words table with word-level timing data for advanced audio sync.
 * Run: npm run seed:words   (or: npx tsx scripts/seed-words.ts)
 * Requires: npm run seed first (surahs, ayahs must exist). Uses SUPABASE_SERVICE_ROLE_KEY.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./seed-database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });

const ROOT = process.cwd();
const WORDS_DIR = path.join(ROOT, "src", "data", "words");

export type WordJson = {
  ayahNumberGlobal: number;
  wordOrder: number;
  textArabic: string;
  transliteration?: string;
  translationShort?: string;
  startTimeMs: number;
  endTimeMs: number;
  tajwidRule?: string;
};

/** Load words from a JSON file (e.g. 001-al-fatiha.json) */
export function loadWordsJson(relativePath: string): WordJson[] {
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(ROOT, relativePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`Invalid words file: expected array, got ${typeof data}`);
  return data as WordJson[];
}

export type SeedWordsStats = { wordsInserted: number };

/** Seed words for a surah. Resolves ayah_id from ayah_number_global via ayahs table. */
export async function runSeedWords(
  client: SupabaseClient,
  options: {
    dataDir?: string;
    surahNumber?: number;
    log?: (msg: string) => void;
  } = {}
): Promise<SeedWordsStats> {
  const log = options.log ?? console.log;
  const surahNumber = options.surahNumber ?? 1;
  const padded = String(surahNumber).padStart(3, "0");
  const wordsPath = path.join(options.dataDir ?? path.join(ROOT, "src", "data", "words"), `${padded}-*.json`);

  const wordsDir = path.join(ROOT, "src", "data", "words");
  const exactPath = path.join(wordsDir, `${padded}-al-fatiha.json`);
  let usedPath = exactPath;
  if (!fs.existsSync(exactPath)) {
    const files = fs.readdirSync(wordsDir).filter((f) => f.startsWith(padded));
    const filePath = files[0] ? path.join(wordsDir, files[0]) : null;
    if (!filePath) {
      log(`No words file for surah ${surahNumber}, skipping.`);
      return { wordsInserted: 0 };
    }
    usedPath = filePath;
  }
  const words = loadWordsJson(usedPath);

  const { data: surahRow } = await client
    .from("surahs")
    .select("id")
    .eq("surah_number", surahNumber)
    .maybeSingle();
  if (!surahRow) {
    throw new Error(`Surah ${surahNumber} not found. Run npm run seed first.`);
  }
  const surahId = (surahRow as { id: number }).id;

  const { data: ayahRows } = await client
    .from("ayahs")
    .select("id, ayah_number_global")
    .eq("surah_id", surahId);
  const ayahGlobalToId = new Map<number, number>();
  for (const row of ayahRows ?? []) {
    ayahGlobalToId.set((row as { ayah_number_global: number }).ayah_number_global, (row as { id: number }).id);
  }

  const rows: Array<{
    ayah_id: number;
    word_order: number;
    text_arabic: string;
    transliteration: string | null;
    translation_short: string | null;
    start_time_ms: number;
    end_time_ms: number;
    tajwid_rule: string;
  }> = [];

  for (const w of words) {
    const ayahId = ayahGlobalToId.get(w.ayahNumberGlobal);
    if (ayahId == null) continue;
    rows.push({
      ayah_id: ayahId,
      word_order: w.wordOrder,
      text_arabic: w.textArabic,
      transliteration: w.transliteration ?? null,
      translation_short: w.translationShort ?? null,
      start_time_ms: w.startTimeMs,
      end_time_ms: w.endTimeMs,
      tajwid_rule: w.tajwidRule ?? "normal",
    });
  }

  if (rows.length === 0) {
    log(`No words to insert for surah ${surahNumber}.`);
    return { wordsInserted: 0 };
  }

  const { error } = await client.from("words").upsert(rows, {
    onConflict: "ayah_id,word_order",
  });
  if (error) throw new Error(`Words upsert failed: ${error.message}`);
  log(`Words: ${rows.length} upserted for surah ${surahNumber}.`);
  return { wordsInserted: rows.length };
}

async function main(): Promise<void> {
  const client = getSupabaseClient();
  await runSeedWords(client, { surahNumber: 1 });
}

const isEntry =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("seed-words");
if (isEntry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
