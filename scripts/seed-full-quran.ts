/**
 * Placeholder for full Quran (Tanzil) dataset import.
 * Use this later to import the complete Tanzil dataset: all 114 surahs, all ayahs.
 *
 * Run: npx tsx scripts/seed-full-quran.ts
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Import structure is ready; implement fetching/parsing of Tanzil data and
 * then reuse seed-database runSeed() or equivalent upsert flow.
 */

import { fileURLToPath } from "url";
import * as path from "path";
import { getSupabaseClient, runSeed } from "./seed-database";

// Future: Tanzil data sources (e.g. URLs or local paths)
// const TANZIL_JSON_BASE = "https://...";
// const TANZIL_AYAHS_PER_SURAH = [7, 286, 200, ...];

async function main(): Promise<void> {
  const client = getSupabaseClient();
  // TODO: Fetch/parse full Tanzil dataset, then:
  // - Either transform to same shape as src/data and call runSeed(client, { dataDir: ... })
  // - Or implement a dedicated full-quran upsert flow here
  console.log("seed-full-quran: placeholder. Implement Tanzil import and call runSeed or custom upsert.");
  await runSeed(client);
}

const __filename = fileURLToPath(import.meta.url);
const isEntryScript =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename);
if (isEntryScript) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
