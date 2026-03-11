/**
 * Verifies that transliterations.text_hq is populated (for HQ transliteration display).
 * Run after migration + fetch-hq-transliteration.ts.
 *
 * Usage: npx tsx scripts/verify-transliteration-hq.ts
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Get first ayah of surah 1 (Bismillah)
  const { data: surah } = await supabase
    .from("surahs")
    .select("id")
    .eq("surah_number", 1)
    .maybeSingle();
  if (!surah) {
    console.error("Surah 1 not found in DB.");
    process.exit(1);
  }

  const { data: ayahs } = await supabase
    .from("ayahs")
    .select("id")
    .eq("surah_id", (surah as { id: number }).id)
    .order("ayah_number_in_surah", { ascending: true })
    .limit(1);
  if (!ayahs?.length) {
    console.error("No ayahs for surah 1.");
    process.exit(1);
  }
  const firstAyahId = (ayahs[0] as { id: number }).id;

  const { data: rows, error } = await supabase
    .from("transliterations")
    .select("ayah_id, text, text_hq")
    .eq("ayah_id", firstAyahId)
    .eq("language_code", "standard");

  if (error) {
    console.error("Query failed:", error.message);
    if (error.message.includes("text_hq") || error.code === "42703") {
      console.error("\n=> Kolona text_hq ne postoji. Pokreni migraciju:");
      console.error("   Supabase Dashboard → SQL Editor → zalijepi sadržaj supabase/migrations/add_transliteration_hq.sql → Run");
    }
    process.exit(1);
  }

  const row = rows?.[0] as { ayah_id: number; text: string; text_hq?: string | null } | undefined;
  if (!row) {
    console.error("Nema reda u transliterations za prvi ayah (language_code=standard).");
    process.exit(1);
  }

  const hasHq = row.text_hq != null && String(row.text_hq).trim().length > 0;
  console.log("Ayah 1:1 (Bismillah)");
  console.log("  text (staro):", row.text ? row.text.slice(0, 50) + "…" : "(prazno)");
  console.log("  text_hq (HQ):", hasHq ? row.text_hq!.slice(0, 50) + "…" : "(prazno ili NULL)");
  if (hasHq) {
    console.log("\n✓ text_hq je popunjen – aplikacija bi trebala prikazivati dijakritičku transliteraciju.");
  } else {
    console.log("\n=> text_hq je prazan. Pokreni skriptu za popunjavanje:");
    console.log("   npx tsx scripts/fetch-hq-transliteration.ts");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
