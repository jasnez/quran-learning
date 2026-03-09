/**
 * Seed Supabase from existing JSON data.
 * Run: npm run seed   (or: npx tsx scripts/seed-database.ts)
 * Loads .env.local if present. Requires SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL).
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Load .env.local from project root when running the script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");
config({ path: envPath });
import {
  mapSurahToRow,
  mapAyahToRow,
  mapTranslationToRow,
  mapTransliterationToRow,
  mapTajwidMarkupToRow,
  mapReciterToRow,
  mapAudioTrackToRow,
  type SurahJson,
  type AyahJson,
  type ReciterJson,
} from "./seed/transform";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const SURAHS_PATH = path.join(DATA_DIR, "surahs.json");
const RECITERS_PATH = path.join(DATA_DIR, "reciters.json");
const AYAHS_DIR = path.join(DATA_DIR, "ayahs");

export type AyahFilePayload = {
  surah: SurahJson;
  ayahs: AyahJson[];
};

/** Load surahs from src/data/surahs.json */
export function loadSurahs(filePath: string = SURAHS_PATH): SurahJson[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SurahJson[];
}

/** Load reciters from src/data/reciters.json */
export function loadReciters(filePath: string = RECITERS_PATH): ReciterJson[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ReciterJson[];
}

/** Path for a surah's ayah file (e.g. 001-al-fatiha.json) */
export function getAyahFilePath(surahNumber: number, slug: string): string {
  const padded = String(surahNumber).padStart(3, "0");
  return path.join(AYAHS_DIR, `${padded}-${slug}.json`);
}

/** Load one ayah file; returns { surah, ayahs } */
export function loadAyahFile(filePath: string): AyahFilePayload {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as AyahFilePayload;
  if (!data.surah || !Array.isArray(data.ayahs)) {
    throw new Error(`Invalid ayah file shape: ${filePath}`);
  }
  return data;
}

/** Get Supabase client using service role key (required for seeding). */
export function getSupabaseClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or URL. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase Dashboard → Settings → API → service_role). URL is read from NEXT_PUBLIC_SUPABASE_URL if SUPABASE_URL is not set."
    );
  }
  return createClient(url, key);
}

export type SeedStats = {
  surahsInserted: number;
  ayahsInserted: number;
  translationsInserted: number;
  transliterationsInserted: number;
  tajwidInserted: number;
  recitersInserted: number;
  audioTracksInserted: number;
};

/** Run full seed: reciters → surahs → for each surah with ayah file: ayahs, translations, transliterations, tajwid_markup, audio_tracks. */
export async function runSeed(
  client: SupabaseClient,
  options: {
    dataDir?: string;
    log?: (msg: string) => void;
  } = {}
): Promise<SeedStats> {
  const log = options.log ?? console.log;
  const dataDir = options.dataDir ?? DATA_DIR;
  const surahsPath = path.join(dataDir, "surahs.json");
  const recitersPath = path.join(dataDir, "reciters.json");
  const ayahsDir = path.join(dataDir, "ayahs");

  const stats: SeedStats = {
    surahsInserted: 0,
    ayahsInserted: 0,
    translationsInserted: 0,
    transliterationsInserted: 0,
    tajwidInserted: 0,
    recitersInserted: 0,
    audioTracksInserted: 0,
  };

  const surahs = loadSurahs(surahsPath);
  const reciters = loadReciters(recitersPath);

  log(`Loaded ${surahs.length} surahs, ${reciters.length} reciters.`);

  // 1) Reciters (upsert by id)
  const reciterRows = reciters.map(mapReciterToRow);
  const { error: recErr } = await client.from("reciters").upsert(reciterRows, {
    onConflict: "id",
  });
  if (recErr) throw new Error(`Reciters upsert failed: ${recErr.message}`);
  stats.recitersInserted = reciterRows.length;
  log(`Reciters: ${stats.recitersInserted} upserted.`);

  // 2) Surahs (upsert by surah_number)
  const surahRows = surahs.map(mapSurahToRow);
  const { data: surahData, error: surahErr } = await client
    .from("surahs")
    .upsert(surahRows, { onConflict: "surah_number" })
    .select("id, surah_number");
  if (surahErr) throw new Error(`Surahs upsert failed: ${surahErr.message}`);
  const surahNumberToId = new Map<number, number>();
  for (const row of surahData ?? []) {
    surahNumberToId.set(row.surah_number, row.id);
  }
  stats.surahsInserted = surahRows.length;
  log(`Surahs: ${stats.surahsInserted} upserted.`);

  const totalSurahs = surahs.length;

  for (let i = 0; i < surahs.length; i++) {
    const surah = surahs[i];
    const surahId = surahNumberToId.get(surah.surahNumber);
    if (surahId == null) continue;

    const ayahPath = path.join(
      ayahsDir,
      `${String(surah.surahNumber).padStart(3, "0")}-${surah.slug}.json`
    );
    if (!fs.existsSync(ayahPath)) {
      log(`Seeding surah ${surah.surahNumber}/${totalSurahs}... (no ayah file, skip)`);
      continue;
    }

    log(`Seeding surah ${surah.surahNumber}/${totalSurahs}...`);
    const { ayahs } = loadAyahFile(ayahPath);

    const ayahRows = ayahs.map((a) => mapAyahToRow(a, surahId));
    const { data: ayahData, error: ayahErr } = await client
      .from("ayahs")
      .upsert(ayahRows, { onConflict: "surah_id,ayah_number_in_surah" })
      .select("id, ayah_number_global");
    if (ayahErr) throw new Error(`Ayahs upsert failed: ${ayahErr.message}`);

    const ayahGlobalToId = new Map<number, number>();
    for (const row of ayahData ?? []) {
      ayahGlobalToId.set(row.ayah_number_global, row.id);
    }
    stats.ayahsInserted += ayahs.length;

    const translationRows: Array<{
      ayah_id: number;
      language_code: string;
      translator_name: string;
      translation_text: string;
      is_primary: boolean;
    }> = [];
    const transliterationRows: Array<{
      ayah_id: number;
      language_code: string;
      text: string;
      is_primary: boolean;
    }> = [];
    const tajwidRows: Array<{
      ayah_id: number;
      markup_payload: unknown;
      rule_system: string;
      is_primary: boolean;
    }> = [];
    const audioRows: Array<{
      ayah_id: number;
      reciter_id: string;
      file_url: string;
      duration_ms: number | null;
      format: string;
      is_primary: boolean;
    }> = [];

    for (const a of ayahs) {
      const ayahId = ayahGlobalToId.get(a.ayahNumberGlobal);
      if (ayahId == null) continue;
      translationRows.push(mapTranslationToRow(a, ayahId));
      transliterationRows.push(mapTransliterationToRow(a, ayahId));
      tajwidRows.push(mapTajwidMarkupToRow(a, ayahId));
      audioRows.push(mapAudioTrackToRow(a, ayahId));
    }

    if (translationRows.length) {
      const { error: trErr } = await client
        .from("translations")
        .upsert(translationRows, {
          onConflict: "ayah_id,language_code,translator_name",
        });
      if (trErr) throw new Error(`Translations upsert failed: ${trErr.message}`);
      stats.translationsInserted += translationRows.length;
    }
    if (transliterationRows.length) {
      const { error: tlErr } = await client
        .from("transliterations")
        .upsert(transliterationRows, {
          onConflict: "ayah_id,language_code",
        });
      if (tlErr)
        throw new Error(`Transliterations upsert failed: ${tlErr.message}`);
      stats.transliterationsInserted += transliterationRows.length;
    }
    if (tajwidRows.length) {
      const { error: tjErr } = await client
        .from("tajwid_markup")
        .upsert(tajwidRows, { onConflict: "ayah_id,rule_system" });
      if (tjErr) throw new Error(`Tajwid markup upsert failed: ${tjErr.message}`);
      stats.tajwidInserted += tajwidRows.length;
    }
    if (audioRows.length) {
      const { error: auErr } = await client
        .from("audio_tracks")
        .upsert(audioRows, { onConflict: "ayah_id,reciter_id" });
      if (auErr) throw new Error(`Audio tracks upsert failed: ${auErr.message}`);
      stats.audioTracksInserted += audioRows.length;
    }
  }

  log(`Done: ${stats.ayahsInserted} ayahs inserted.`);
  return stats;
}

async function main(): Promise<void> {
  const client = getSupabaseClient();
  await runSeed(client);
}

const isEntryScript =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isEntryScript) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
