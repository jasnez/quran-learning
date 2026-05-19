/**
 * Generates public/data/search-index.json — a minimal Quran search corpus
 * (Arabic text, transliteration, Bosnian translation, surah names) used by
 * client-side search in static-exported builds.
 *
 * Read once on the search page, then searchEngine.ts runs purely in-browser.
 *
 * Run: npm run generate:search-index
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SURAHS_PATH = path.join(ROOT, "src", "data", "surahs.json");
const AYAHS_DIR = path.join(ROOT, "src", "data", "ayahs");
const OUT_PATH = path.join(ROOT, "public", "data", "search-index.json");

type SurahMeta = {
  surahNumber: number;
  slug: string;
  nameLatin: string;
  nameBosnian: string;
  nameArabic: string;
  revelationType: string;
  ayahCount: number;
};

type AyahFile = {
  surah: SurahMeta;
  ayahs: Array<{
    id: string;
    ayahNumber: number;
    ayahNumberGlobal: number;
    juz: number;
    page: number;
    arabicText: string;
    transliteration: string;
    translationBosnian: string;
  }>;
};

type SearchSurah = {
  surahNumber: number;
  slug: string;
  nameLatin: string;
  nameBosnian: string;
  nameArabic: string;
  ayahs: Array<{
    ayahNumber: number;
    arabicText: string;
    transliteration: string;
    translationBosnian: string;
  }>;
};

function paddedSurah(n: number): string {
  return String(n).padStart(3, "0");
}

function main() {
  const surahs = JSON.parse(fs.readFileSync(SURAHS_PATH, "utf-8")) as SurahMeta[];
  const out: SearchSurah[] = [];

  for (const surah of surahs) {
    const filePath = path.join(
      AYAHS_DIR,
      `${paddedSurah(surah.surahNumber)}-${surah.slug}.json`,
    );
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AyahFile;
    out.push({
      surahNumber: surah.surahNumber,
      slug: surah.slug,
      nameLatin: surah.nameLatin,
      nameBosnian: surah.nameBosnian,
      nameArabic: surah.nameArabic,
      ayahs: data.ayahs.map((a) => ({
        ayahNumber: a.ayahNumber,
        arabicText: a.arabicText,
        transliteration: a.transliteration,
        translationBosnian: a.translationBosnian,
      })),
    });
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  // No pretty-printing — saves ~500KB on a multi-MB file
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  const sizeKB = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  const totalAyahs = out.reduce((n, s) => n + s.ayahs.length, 0);
  console.log(
    `✓ search-index.json — ${out.length} surahs, ${totalAyahs} ayahs, ${sizeKB} KB`,
  );
}

main();
