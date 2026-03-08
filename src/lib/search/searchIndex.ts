import path from "path";
import fs from "fs";
import type { SurahDetail, Ayah } from "@/types/quran";
import { getAllSurahs } from "@/lib/data";
import { getUthmaniAyahs } from "./loadUthmaniXml";

let cachedIndex: SurahDetail[] | null = null;

/** Build minimal Ayah for search from XML (Arabic only). */
function ayahFromXml(
  surahNumber: number,
  ayahNumber: number,
  ayahNumberGlobal: number,
  arabicText: string
): Ayah {
  return {
    id: `${surahNumber}:${ayahNumber}`,
    ayahNumber,
    ayahNumberGlobal,
    juz: 0,
    page: 0,
    arabicText,
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "", url: "", durationMs: 0 },
  };
}

/**
 * Pre-loads and indexes all available surah data.
 * Uses JSON files from src/data/ayahs/ when present; otherwise loads Arabic text
 * from Tanzil Uthmani XML (quran-uthmani (1).xml) so search covers all 114 surahs.
 * Caches the result in memory.
 */
export function getSearchIndex(): SurahDetail[] {
  if (cachedIndex !== null) {
    return cachedIndex;
  }

  const surahs = getAllSurahs();
  const index: SurahDetail[] = [];
  let globalOffset = 0;

  for (const surah of surahs) {
    const padded = String(surah.surahNumber).padStart(3, "0");
    const filename = `${padded}-${surah.slug}.json`;
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "ayahs",
      filename
    );

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as {
        surah: SurahDetail["surah"];
        ayahs: SurahDetail["ayahs"];
      };
      if (data.ayahs && data.ayahs.length > 0) {
        index.push({ surah: data.surah, ayahs: data.ayahs });
        globalOffset += data.ayahs.length;
        continue;
      }
    } catch {
      // No file or invalid JSON — fall back to XML
    }

    // Fallback: load from Tanzil XML (Arabic only)
    const xmlAyahs = getUthmaniAyahs(surah.surahNumber);
    if (xmlAyahs.length > 0) {
      const ayahs: Ayah[] = xmlAyahs.map((a, i) =>
        ayahFromXml(
          surah.surahNumber,
          a.index,
          globalOffset + i + 1,
          a.text
        )
      );
      index.push({ surah, ayahs });
      globalOffset += ayahs.length;
    }
  }

  cachedIndex = index;
  return index;
}

/**
 * Clears the in-memory index. Next getSearchIndex() will rebuild.
 * Useful for tests or when data files change.
 */
export function clearSearchIndex(): void {
  cachedIndex = null;
}
