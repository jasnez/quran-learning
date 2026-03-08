import path from "path";
import fs from "fs";
import type { SurahDetail } from "@/types/quran";
import { getAllSurahs } from "@/lib/data";

let cachedIndex: SurahDetail[] | null = null;

/**
 * Pre-loads and indexes all available surah ayah JSON files.
 * Caches the result in memory so subsequent calls are instant.
 * Only surahs that have a file under src/data/ayahs/ are included.
 */
export function getSearchIndex(): SurahDetail[] {
  if (cachedIndex !== null) {
    return cachedIndex;
  }

  const surahs = getAllSurahs();
  const index: SurahDetail[] = [];

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
      const data = JSON.parse(raw) as { surah: SurahDetail["surah"]; ayahs: SurahDetail["ayahs"] };
      if (data.ayahs && data.ayahs.length > 0) {
        index.push({ surah: data.surah, ayahs: data.ayahs });
      }
    } catch {
      // No file or invalid JSON — skip this surah
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
