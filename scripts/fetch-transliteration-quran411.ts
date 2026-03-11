/**
 * Scrapes transliteration from Quran411.com and updates Supabase transliterations.text_hq.
 * Optional: convert to academic Unicode (ā ī ū) with --unicode flag.
 *
 * Prerequisites:
 * 1. Run supabase/migrations/add_transliteration_hq.sql
 * 2. .env.local: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/fetch-transliteration-quran411.ts
 *   npx tsx scripts/fetch-transliteration-quran411.ts --unicode
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });

const QURAN411_BASE = "https://quran411.com";
const DELAY_MS = 800;

/** Quran411 URL slug per surah (1–114). May need adjustment if site structure changes. */
const Q411_SLUGS: Record<number, string> = {
  1: "fatiha", 2: "baqarah", 3: "imran", 4: "nisa", 5: "maidah", 6: "anam", 7: "araf", 8: "anfal",
  9: "taubah", 10: "yunus", 11: "hud", 12: "yusuf", 13: "rad", 14: "ibrahim", 15: "hijr", 16: "nahl",
  17: "al-isra", 18: "kahf", 19: "maryam", 20: "taha", 21: "anbiya", 22: "hajj", 23: "muminun", 24: "nur",
  25: "furqan", 26: "shuara", 27: "naml", 28: "qasas", 29: "ankabut", 30: "ar-rum", 31: "luqman", 32: "sajdah",
  33: "ahzab", 34: "saba", 35: "fatir", 36: "yaseen", 37: "saffat", 38: "sad", 39: "az-zumar", 40: "gafir",
  41: "fussilat", 42: "ash-shura", 43: "zukhruf", 44: "dukhan", 45: "jasiyah", 46: "ahqaf", 47: "muhammad", 48: "fath",
  49: "hujurat", 50: "qaf", 51: "dhariyat", 52: "tur", 53: "najm", 54: "qamar", 55: "ar-rahman", 56: "waqiah",
  57: "hadid", 58: "mujadilah", 59: "hashr", 60: "mumtahanah", 61: "saff", 62: "jumuah", 63: "munafiqun", 64: "taghabun",
  65: "talaq", 66: "tahrim", 67: "mulk", 68: "qalam", 69: "haqqah", 70: "maarij", 71: "nuh", 72: "jinn",
  73: "muzzammil", 74: "muddaththir", 75: "qiyamah", 76: "insan", 77: "mursalat", 78: "naba", 79: "naziat", 80: "abasa",
  81: "takwir", 82: "infitaar", 83: "mutaffifin", 84: "inshiqaq", 85: "burooj", 86: "tariq", 87: "ala", 88: "ghaashiyah",
  89: "fajr", 90: "balad", 91: "ash-shams", 92: "lail", 93: "duha", 94: "inshirah", 95: "tin", 96: "alaq",
  97: "qadr", 98: "bayyinah", 99: "zilzal", 100: "adiyat", 101: "qariah", 102: "takathur", 103: "asr", 104: "humazah",
  105: "fil", 106: "quraish", 107: "maun", 108: "kauthar", 109: "kafirun", 110: "nasr", 111: "masad", 112: "ikhlas",
  113: "falaq", 114: "nas",
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract verse lines "N. transliteration text" from HTML. Quran411 lists verses in reverse order (last first). */
function parseTransliterationFromHtml(html: string, totalVerses: number): Map<number, string> {
  const map = new Map<number, string>();
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  // Match "7. Bismillaahir Rahmaanir Raheem" etc.
  const re = /(\d+)\.\s+([^.]+?)(?=\s+\d+\.|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const displayedNum = parseInt(m[1], 10);
    const text = m[2].trim();
    if (displayedNum < 1 || displayedNum > totalVerses || !text || text.length < 3) continue;
    const ayahNumber = totalVerses + 1 - displayedNum;
    map.set(ayahNumber, text);
  }
  return map;
}

/** Optional: convert Quran411 format (aa, ee, ii, oo) to academic Unicode (ā, ī, ū). Basic pass. */
function toUnicode(text: string): string {
  return text
    .replace(/Bismillaahir Rahmaanir Raheem/gi, "Bismillāhi r-raḥmāni r-raḥīm")
    .replace(/Rahmaanir Raheem/gi, "r-raḥmāni r-raḥīm")
    .replace(/lillaahi/gi, "li-llāhi")
    .replace(/Rabbil 'aalameen/gi, "Rabbi l-ʿālamīn")
    .replace(/'aalameen/gi, "ʿālamīn")
    .replace(/([a-zA-Z])aa([a-zA-Z])/g, "$1ā$2")
    .replace(/\baa\b/g, "ā")
    .replace(/([a-zA-Z])ee([a-zA-Z])/g, "$1ī$2")
    .replace(/\bee\b/g, "ī")
    .replace(/([a-zA-Z])oo([a-zA-Z])/g, "$1ū$2")
    .replace(/\boo\b/g, "ū")
    .replace(/\bii\b/g, "ī")
    .replace(/'/g, "ʿ");
}

async function main() {
  const convertToUnicode = process.argv.includes("--unicode");
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, key);

  for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
    const slug = Q411_SLUGS[surahNumber];
    if (!slug) {
      console.warn(`Surah ${surahNumber}: no slug, skipping.`);
      await delay(DELAY_MS);
      continue;
    }

    const { data: surahRow, error: surahErr } = await supabase
      .from("surahs")
      .select("id, ayah_count")
      .eq("surah_number", surahNumber)
      .maybeSingle();
    if (surahErr || !surahRow) {
      console.warn(`Surah ${surahNumber}/114: not found in DB, skipping.`);
      await delay(DELAY_MS);
      continue;
    }
    const surahId = (surahRow as { id: number }).id;
    const totalVerses = (surahRow as { ayah_count: number }).ayah_count ?? 7;

    const pageUrl = `${QURAN411_BASE}/surah-${slug}`;
    let html: string;
    try {
      const res = await fetch(pageUrl, { headers: { "User-Agent": "Mozilla/5.0 (compatible; QuranLearning/1.0)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const cause = e instanceof Error && e.cause ? ` (${(e.cause as Error).message})` : "";
      console.warn(`Surah ${surahNumber}/114: fetch failed ${pageUrl}: ${msg}${cause}`);
      await delay(DELAY_MS);
      continue;
    }

    const verseMap = parseTransliterationFromHtml(html, totalVerses);
    if (verseMap.size === 0) {
      console.warn(`Surah ${surahNumber}/114: no verses parsed from HTML.`);
      await delay(DELAY_MS);
      continue;
    }

    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, ayah_number_in_surah")
      .eq("surah_id", surahId)
      .order("ayah_number_in_surah", { ascending: true });
    if (ayahErr || !ayahRows?.length) {
      console.warn(`Surah ${surahNumber}/114: no ayahs in DB, skipping.`);
      await delay(DELAY_MS);
      continue;
    }

    const ayahIdByNumber = new Map((ayahRows as { id: number; ayah_number_in_surah: number }[]).map((r) => [r.ayah_number_in_surah, r.id]));
    let updated = 0;
    for (const [ayahNum, text] of verseMap) {
      const ayahId = ayahIdByNumber.get(ayahNum);
      if (!ayahId) continue;
      const finalText = convertToUnicode ? toUnicode(text) : text;
      const { error: updErr } = await supabase
        .from("transliterations")
        .update({ text_hq: finalText })
        .eq("ayah_id", ayahId)
        .eq("language_code", "standard");
      if (!updErr) updated++;
    }

    console.log(`Surah ${surahNumber}/114 done. Updated ${updated}/${verseMap.size} ayahs.`);
    await delay(DELAY_MS);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
