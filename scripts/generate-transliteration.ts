/**
 * Regenerates the `transliteration` field of src/data/ayahs/*.json from the stored Arabic
 * text, in the "specijal" system of the Islamic Community in Bosnia and Herzegovina (see
 * src/lib/quran/transliteration.ts), and copies it to the Quranic duas in
 * src/lib/duas/data.ts. No network access; no other field is touched.
 * Afterwards run `npm run generate:search-index`: the search index holds a copy.
 *
 * The particles that are written as separate words come from
 * src/data/transliteration/particles.json (scripts/generate-particle-lexicon.ts).
 *
 * Run from the project root:
 *   npx tsx scripts/generate-transliteration.ts                  report only, writes nothing
 *   npx tsx scripts/generate-transliteration.ts --print 1:1 2:255  print single ayahs
 *   npx tsx scripts/generate-transliteration.ts --write          rewrite the field in all files
 */

import * as fs from "fs";
import * as path from "path";
import { transliterateAyah } from "../src/lib/quran/transliteration";

const AYAHS_DIR = path.join(process.cwd(), "src", "data", "ayahs");
const DUAS_PATH = path.join(process.cwd(), "src", "lib", "duas", "data.ts");
const LEXICON_PATH = path.join(process.cwd(), "src", "data", "transliteration", "particles.json");
const TOTAL_AYAHS = 6236;

type AyahJson = { id: string; arabicText: string; transliteration: string };
type SurahJson = { ayahs: AyahJson[] };

/**
 * The Quranic duas in src/lib/duas/data.ts are whole ayahs: the `transliteration` line of each
 * entry is rewritten from the ayah with the same id. An entry whose Arabic text is not the
 * whole ayah is reported instead of being given a text that does not belong to it.
 */
function rewriteDuas(
  source: string,
  ayahs: Map<string, AyahJson>,
  problems: string[]
): { text: string; total: number; changed: number } {
  let id: string | null = null;
  let total = 0;
  let changed = 0;
  const lines = source.split("\n").map((line) => {
    const idLine = line.match(/^\s*id: "(\d+:\d+)",\s*$/);
    if (idLine) {
      id = idLine[1];
      return line;
    }
    if (id === null) return line;
    const ayah = ayahs.get(id);
    const arabicLine = line.match(/^\s*arabic: (".*"),\s*$/);
    if (arabicLine) {
      if (!ayah) problems.push(`dua ${id}: no such ayah`);
      else if ((JSON.parse(arabicLine[1]) as string).trim() !== ayah.arabicText.trim()) {
        problems.push(`dua ${id}: its Arabic text is not the whole ayah`);
      }
      return line;
    }
    const transliterationLine = line.match(/^(\s*)transliteration: ".*",(\s*)$/);
    if (!transliterationLine || !ayah) return line;
    const next = `${transliterationLine[1]}transliteration: ${JSON.stringify(ayah.transliteration)},${transliterationLine[2]}`;
    total++;
    if (next !== line) changed++;
    id = null;
    return next;
  });
  return { text: lines.join("\n"), total, changed };
}

function main(): void {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const printIndex = args.indexOf("--print");
  const printIds = printIndex >= 0 ? new Set(args.slice(printIndex + 1).filter((a) => !a.startsWith("--"))) : null;

  const lexicon = JSON.parse(fs.readFileSync(LEXICON_PATH, "utf-8")) as Record<string, number>;
  const particles = (word: string) => lexicon[word] ?? 0;

  const files = fs.readdirSync(AYAHS_DIR).filter((f) => f.endsWith(".json")).sort();
  const outputs: { filePath: string; data: SurahJson }[] = [];
  const problems: string[] = [];
  let total = 0;
  let changed = 0;

  for (const file of files) {
    const filePath = path.join(AYAHS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SurahJson;
    for (const ayah of data.ayahs) {
      total++;
      const result = transliterateAyah(ayah.arabicText, { particles });
      for (const warning of result.warnings) problems.push(`${ayah.id}: ${warning}`);
      if (result.text.length === 0) problems.push(`${ayah.id}: empty transliteration`);
      if (printIds?.has(ayah.id)) console.log(`${ayah.id}\t${result.text}`);
      if (ayah.transliteration !== result.text) changed++;
      ayah.transliteration = result.text;
    }
    outputs.push({ filePath, data });
  }

  if (total !== TOTAL_AYAHS) problems.push(`expected ${TOTAL_AYAHS} ayahs, found ${total}`);

  const ayahsById = new Map(outputs.flatMap(({ data }) => data.ayahs.map((a) => [a.id, a] as const)));
  const duas = rewriteDuas(fs.readFileSync(DUAS_PATH, "utf-8"), ayahsById, problems);
  if (duas.total === 0) problems.push("no dua entries found in src/lib/duas/data.ts");

  if (problems.length > 0) {
    console.error(`${problems.length} problem(s), nothing written:`);
    for (const problem of problems.slice(0, 20)) console.error(`  ${problem}`);
    process.exit(1);
  }

  if (!write) {
    console.log(`${total} ayahs transliterated, ${changed} differ from the stored text.`);
    console.log(`${duas.total} duas, ${duas.changed} differ from the stored text. Run with --write to save.`);
    return;
  }
  // Same formatting as scripts/generate-ayahs-json.ts, so only the changed lines show up in a diff.
  for (const { filePath, data } of outputs) fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  fs.writeFileSync(DUAS_PATH, duas.text, "utf-8");
  console.log(`${total} ayahs written to ${outputs.length} files (${changed} changed).`);
  console.log(`${duas.total} duas written (${duas.changed} changed).`);
}

main();
