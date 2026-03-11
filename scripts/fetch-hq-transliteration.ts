/**
 * Fetches high-quality (diacritical) transliteration from Quran.com API (resource_id 57)
 * and updates Supabase transliterations.text_hq. Does NOT modify the existing "text" column.
 *
 * Prerequisites:
 * 1. Run supabase/migrations/add_transliteration_hq.sql in Supabase SQL Editor.
 * 2. Ensure .env.local has SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run: npx tsx scripts/fetch-hq-transliteration.ts
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });

const QURAN_API_BASE = "https://api.quran.com/api/v4";
const TRANSLITERATION_RESOURCE_ID = 57;
const PER_PAGE = 50;
const DELAY_MS = 500;

type ApiVerse = {
  verse_number: number;
  verse_key: string;
  translations?: { resource_id: number; text: string }[];
};

type ApiResponse = {
  verses: ApiVerse[];
  pagination: { total_pages: number; current_page: number; next_page: number | null };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchVerses(chapterNumber: number, page: number): Promise<ApiResponse> {
  const url = new URL(`${QURAN_API_BASE}/verses/by_chapter/${chapterNumber}`);
  url.searchParams.set("translations", String(TRANSLITERATION_RESOURCE_ID));
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Quran API ${res.status} for chapter ${chapterNumber} page ${page}`);
  return res.json() as Promise<ApiResponse>;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, key);

  for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
    const { data: surahRow, error: surahErr } = await supabase
      .from("surahs")
      .select("id")
      .eq("surah_number", surahNumber)
      .maybeSingle();

    if (surahErr || !surahRow) {
      console.warn(`Surah ${surahNumber}/114: no row found, skipping.`);
      await delay(DELAY_MS);
      continue;
    }

    const surahId = (surahRow as { id: number }).id;

    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, ayah_number_in_surah")
      .eq("surah_id", surahId)
      .order("ayah_number_in_surah", { ascending: true });

    if (ayahErr || !ayahRows?.length) {
      console.warn(`Surah ${surahNumber}/114: no ayahs, skipping.`);
      await delay(DELAY_MS);
      continue;
    }

    const ayahIdByVerseNumber = new Map<number, number>();
    (ayahRows as { id: number; ayah_number_in_surah: number }[]).forEach((r) => {
      ayahIdByVerseNumber.set(r.ayah_number_in_surah, r.id);
    });

    let page = 1;
    let totalUpdated = 0;

    while (true) {
      const data = await fetchVerses(surahNumber, page);
      const verses = data.verses ?? [];

      for (const v of verses) {
        const text = v.translations?.find((t) => t.resource_id === TRANSLITERATION_RESOURCE_ID)?.text;
        if (!text) continue;

        const textHq = stripHtml(text);
        const ayahId = ayahIdByVerseNumber.get(v.verse_number);
        if (ayahId == null) continue;

        const { error: updateErr } = await supabase
          .from("transliterations")
          .update({ text_hq: textHq })
          .eq("ayah_id", ayahId)
          .eq("language_code", "standard");

        if (updateErr) {
          console.warn(`  verse ${v.verse_key}: update failed ${updateErr.message}`);
        } else {
          totalUpdated++;
        }
      }

      if (data.pagination?.next_page == null) break;
      page = data.pagination.next_page;
    }

    console.log(`Surah ${surahNumber}/114 done. Updated ${totalUpdated} ayahs.`);
    await delay(DELAY_MS);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
