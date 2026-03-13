/**
 * Generates a CSV with HQ transliteration (text_hq) from local transliteration text files.
 *
 * Input:
 *   C:\Users\Jasne\Quran-learning\transliteracija\
 *     - "Transliteracija 1. dio.txt"  (surahs 1–35)
 *     - "Transliteracija 2. dio.txt"  (surahs 36–51)
 *     - "Transliteracija 3. dio.txt"  (surahs 52–114)
 *
 * Output (relative to repo root):
 *   transliterations_hq_import.csv
 *
 * Columns:
 *   surah_number, ayah_number, language_code, text_hq
 *
 * Usage:
 *   cd quran-learning-main
 *   npx tsx scripts/generate-hq-transliteration-from-files.ts
 */

import fs from "fs";
import path from "path";

type SurahMeta = {
  surahNumber: number;
  ayahCount: number;
};

type FileConfig = {
  filename: string;
  startSurah: number;
  endSurah: number;
};

const LANGUAGE_CODE = "standard";

const FILES: FileConfig[] = [
  { filename: "Transliteracija 1. dio.txt", startSurah: 1, endSurah: 35 },
  { filename: "Transliteracija 2. dio.txt", startSurah: 36, endSurah: 51 },
  { filename: "Transliteracija 3. dio.txt", startSurah: 52, endSurah: 114 },
];

function loadSurahMeta(): SurahMeta[] {
  const surahsPath = path.join(process.cwd(), "src", "data", "surahs.json");
  const raw = fs.readFileSync(surahsPath, "utf-8");
  const parsed = JSON.parse(raw) as { surahNumber: number; ayahCount: number }[];
  return parsed.map((s) => ({ surahNumber: s.surahNumber, ayahCount: s.ayahCount }));
}

function cleanLine(line: string): string {
  let t = line.trim();
  if (!t) return "";
  // Drop header lines like "Transliteracija 1. dio"
  if (/^Transliteracija\s*\d/i.test(t)) return "";
  // Remove "(section X ...)" suffixes
  t = t.replace(/\(section[^)]*\)\s*$/i, "").trim();
  return t;
}

function* iterCleanLines(filePath: string): Generator<string> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const cleaned = cleanLine(line);
    if (!cleaned) continue;
    yield cleaned;
  }
}

function main() {
  const surahs = loadSurahMeta();
  const translitDir = path.join(process.cwd(), "..", "transliteracija");

  const rows: { surah: number; ayah: number; text: string }[] = [];

  for (const file of FILES) {
    const filePath = path.join(translitDir, file.filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }

    const lines = Array.from(iterCleanLines(filePath));
    let lineIdx = 0;

    for (let s = file.startSurah; s <= file.endSurah; s++) {
      const meta = surahs.find((m) => m.surahNumber === s);
      if (!meta) {
        throw new Error(`Surah metadata not found for surah ${s}`);
      }
      for (let ayah = 1; ayah <= meta.ayahCount; ayah++) {
        const line = lines[lineIdx++];
        if (line == null) {
          throw new Error(
            `Ran out of lines in ${file.filename} while mapping surah ${s}, ayah ${ayah}. ` +
              `Expected at least ${meta.ayahCount} lines for this surah.`
          );
        }
        rows.push({ surah: s, ayah, text: line });
      }
    }

    if (lineIdx < lines.length) {
      console.warn(
        `Warning: file "${file.filename}" has ${lines.length - lineIdx} unused non-empty lines ` +
          `(startSurah=${file.startSurah}, endSurah=${file.endSurah}).`
      );
    }
  }

  const outPath = path.join(process.cwd(), "transliterations_hq_import.csv");
  const header = "surah_number,ayah_number,language_code,text_hq";
  const csvLines = [header];

  for (const row of rows) {
    // Escape double quotes and wrap text in quotes.
    const safeText = row.text.replace(/"/g, '""');
    csvLines.push(`${row.surah},${row.ayah},${LANGUAGE_CODE},"${safeText}"`);
  }

  fs.writeFileSync(outPath, csvLines.join("\n"), "utf-8");
  console.log(`Wrote ${rows.length} rows to ${outPath}`);
}

main();

