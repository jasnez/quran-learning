/**
 * Verifies that Supabase has all required tables and they are accessible.
 * Run: npx tsx scripts/verify-supabase-schema.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in .env.local
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env.local") });

/** Tables defined in supabase/RUN_ME_IN_SQL_EDITOR.sql - must all exist for migration to be complete */
export const REQUIRED_TABLES = [
  "surahs",
  "ayahs",
  "translations",
  "transliterations",
  "tajwid_markup",
  "reciters",
  "audio_tracks",
  "words",
  "user_profiles",
  "user_settings",
  "user_bookmarks",
  "user_progress",
] as const;

export async function verifyTable(
  supabase: ReturnType<typeof createClient>,
  table: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from(table).select("*").limit(1);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing env: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL). Add to .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("Verifying Supabase schema...\n");

  let allOk = true;
  for (const table of REQUIRED_TABLES) {
    const result = await verifyTable(supabase, table);
    const status = result.ok ? "✓" : "✗";
    const detail = result.ok ? "" : ` — ${result.error}`;
    console.log(`  ${status} ${table}${detail}`);
    if (!result.ok) allOk = false;
  }

  console.log("");
  if (allOk) {
    console.log("All tables verified. Backend migration complete.");
    process.exit(0);
  } else {
    console.error("Some tables are missing or inaccessible. Run supabase/RUN_ME_IN_SQL_EDITOR.sql in Supabase Dashboard.");
    process.exit(1);
  }
}

const isEntry =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].includes("verify-supabase-schema");
if (isEntry) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
