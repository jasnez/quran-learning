/**
 * Fetches Bosnian translation (Besim Korkut) for each Quranic dua from Quran.com API
 * and writes src/lib/duas/data.ts so dove match surah verse translation.
 *
 * Run: npx tsx scripts/sync-dua-translations.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { fetchVerseContentByKey } from "../src/lib/quran/fetch-verse-by-key";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DUAS_MANIFEST: { id: string; category: string }[] = [
  { id: "2:201", category: "rabbana" },
  { id: "2:250", category: "patience" },
  { id: "2:286", category: "rabbana" },
  { id: "3:8", category: "guidance" },
  { id: "3:16", category: "forgiveness" },
  { id: "3:38", category: "family" },
  { id: "3:53", category: "rabbana" },
  { id: "3:147", category: "patience" },
  { id: "3:191", category: "rabbana" },
  { id: "3:192", category: "rabbana" },
  { id: "3:193", category: "rabbana" },
  { id: "3:194", category: "rabbana" },
  { id: "7:23", category: "forgiveness" },
  { id: "7:47", category: "rabbana" },
  { id: "7:126", category: "patience" },
  { id: "7:151", category: "forgiveness" },
  { id: "7:155", category: "rabbana" },
  { id: "10:85", category: "rabbana" },
  { id: "10:86", category: "rabbana" },
  { id: "11:47", category: "forgiveness" },
  { id: "12:101", category: "knowledge" },
  { id: "14:40", category: "family" },
  { id: "14:41", category: "forgiveness" },
  { id: "17:24", category: "family" },
  { id: "17:80", category: "guidance" },
  { id: "18:10", category: "rabbana" },
  { id: "19:4", category: "family" },
  { id: "19:5", category: "family" },
  { id: "20:25", category: "knowledge" },
  { id: "20:26", category: "knowledge" },
  { id: "20:27", category: "knowledge" },
  { id: "20:28", category: "knowledge" },
  { id: "20:114", category: "knowledge" },
  { id: "21:83", category: "forgiveness" },
  { id: "21:87", category: "forgiveness" },
  { id: "21:89", category: "family" },
  { id: "23:97", category: "rabbana" },
  { id: "23:98", category: "rabbana" },
  { id: "23:109", category: "rabbana" },
  { id: "23:118", category: "forgiveness" },
  { id: "25:74", category: "family" },
  { id: "26:83", category: "rabbana" },
  { id: "26:84", category: "rabbana" },
  { id: "26:85", category: "rabbana" },
  { id: "26:86", category: "forgiveness" },
  { id: "26:87", category: "rabbana" },
  { id: "26:88", category: "rabbana" },
  { id: "26:89", category: "rabbana" },
  { id: "26:169", category: "family" },
  { id: "27:19", category: "rabbana" },
  { id: "28:16", category: "forgiveness" },
  { id: "29:30", category: "patience" },
  { id: "40:7", category: "rabbana" },
  { id: "40:8", category: "rabbana" },
  { id: "40:9", category: "rabbana" },
  { id: "44:12", category: "rabbana" },
  { id: "46:15", category: "family" },
  { id: "59:10", category: "rabbana" },
  { id: "60:4", category: "rabbana" },
  { id: "60:5", category: "rabbana" },
  { id: "66:8", category: "rabbana" },
  { id: "66:11", category: "family" },
  { id: "71:28", category: "forgiveness" },
];

function escapeForTs(str: string): string {
  return JSON.stringify(str);
}

async function main() {
  const out: string[] = [];
  out.push('import type { QuranicDua, DuaCategory } from "@/types/duas";');
  out.push("");
  out.push("/**");
  out.push(" * Kur'anske dove – izvori iz Kur'ana sa tačnom referencom (sura i ajet).");
  out.push(" * Prijevod: Besim Korkut (Quran.com, resource_id 126) – isti kao u prikazu sura.");
  out.push(" * Generirano: npx tsx scripts/sync-dua-translations.ts");
  out.push(" */");
  out.push("export const QURANIC_DUAS: QuranicDua[] = [");

  for (let i = 0; i < DUAS_MANIFEST.length; i++) {
    const item = DUAS_MANIFEST[i];
    const [surahStr, ayahStr] = item.id.split(":");
    const surahNumber = parseInt(surahStr!, 10);
    const ayahNumber = parseInt(ayahStr!, 10);
    process.stdout.write(`Fetching ${item.id} (${i + 1}/${DUAS_MANIFEST.length})...\r`);
    const content = await fetchVerseContentByKey(item.id);
    out.push("  {");
    out.push(`    id: ${escapeForTs(item.id)},`);
    out.push(`    surahNumber: ${surahNumber},`);
    out.push(`    ayahNumber: ${ayahNumber},`);
    out.push(`    arabic: ${escapeForTs(content.arabic)},`);
    out.push(`    transliteration: ${escapeForTs(content.transliteration)},`);
    out.push(`    translationBosnian: ${escapeForTs(content.translationBosnian)},`);
    out.push(`    category: "${item.category}" as DuaCategory,`);
    out.push("  },");
  }

  out.push("];");
  out.push("");
  out.push("const CATEGORIES: DuaCategory[] = [");
  out.push('  "forgiveness",');
  out.push('  "knowledge",');
  out.push('  "guidance",');
  out.push('  "patience",');
  out.push('  "family",');
  out.push('  "rabbana",');
  out.push("];");
  out.push("");
  out.push("export function getDuasByCategory(category: DuaCategory): QuranicDua[] {");
  out.push("  return QURANIC_DUAS.filter((d) => d.category === category);");
  out.push("}");
  out.push("");
  out.push("export const DUAS_BY_CATEGORY: Record<DuaCategory, QuranicDua[]> =");
  out.push("  Object.fromEntries(");
  out.push("    CATEGORIES.map((cat) => [cat, getDuasByCategory(cat)])");
  out.push("  ) as Record<DuaCategory, QuranicDua[]>;");

  const dataPath = path.join(ROOT, "src/lib/duas/data.ts");
  fs.writeFileSync(dataPath, out.join("\n") + "\n", "utf-8");
  console.log(`\nWrote ${dataPath} (${DUAS_MANIFEST.length} duas).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
