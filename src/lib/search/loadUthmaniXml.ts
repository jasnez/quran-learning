/**
 * Loads Tanzil Uthmani Quran XML for search indexing.
 * Uses only Arabic text from XML; no changes to the text (Tanzil license).
 * Source: tanzil.net
 */

import path from "path";
import fs from "fs";

export type XmlAyah = {
  index: number;
  text: string;
  bismillah?: string;
};

export type XmlSurah = {
  index: number;
  name: string;
  ayahs: XmlAyah[];
};

let cachedXml: XmlSurah[] | null = null;

const XML_FILENAMES = [
  "quran-uthmani (1).xml",
  "quran-uthmani.xml",
];

function findXmlPath(): string | null {
  const candidates = [
    process.cwd(),
    path.join(process.cwd(), ".."),
    path.join(process.cwd(), "src", "data"),
  ];
  for (const dir of candidates) {
    for (const name of XML_FILENAMES) {
      const p = path.join(dir, name);
      try {
        if (fs.existsSync(p)) return p;
      } catch {
        // skip
      }
    }
  }
  return null;
}

/**
 * Parses Tanzil XML into surahs with ayahs. Caches result.
 * Returns empty array if file not found or parse fails.
 */
export function loadUthmaniXml(): XmlSurah[] {
  if (cachedXml !== null) return cachedXml;

  const xmlPath = findXmlPath();
  if (!xmlPath) {
    cachedXml = [];
    return [];
  }

  let raw: string;
  try {
    raw = fs.readFileSync(xmlPath, "utf-8");
  } catch {
    cachedXml = [];
    return [];
  }

  const surahs: XmlSurah[] = [];
  // <sura index="1" name="الفاتحة"> ... </sura>
  const suraBlockRegex = /<sura\s+index="(\d+)"\s+name="([^"]*)">([\s\S]*?)<\/sura>/g;
  let blockMatch;
  while ((blockMatch = suraBlockRegex.exec(raw)) !== null) {
    const index = parseInt(blockMatch[1], 10);
    const name = blockMatch[2];
    const inner = blockMatch[3];
    const ayahs: XmlAyah[] = [];
    // <aya index="1" text="..." /> or <aya index="1" text="..." bismillah="..." />
    const ayaRegex = /<aya\s+index="(\d+)"\s+text="([^"]*)"(?:\s+bismillah="([^"]*)")?\s*\/>/g;
    let ayaMatch;
    while ((ayaMatch = ayaRegex.exec(inner)) !== null) {
      ayahs.push({
        index: parseInt(ayaMatch[1], 10),
        text: ayaMatch[2],
        bismillah: ayaMatch[3],
      });
    }
    if (ayahs.length > 0) {
      surahs.push({ index, name, ayahs });
    }
  }

  cachedXml = surahs;
  return surahs;
}

/**
 * Returns ayahs for one surah (1-based). Empty array if not found.
 */
export function getUthmaniAyahs(surahNumber: number): XmlAyah[] {
  const surahs = loadUthmaniXml();
  const surah = surahs.find((s) => s.index === surahNumber);
  return surah ? surah.ayahs : [];
}

/**
 * Clears cached XML (e.g. for tests).
 */
export function clearUthmaniCache(): void {
  cachedXml = null;
}
