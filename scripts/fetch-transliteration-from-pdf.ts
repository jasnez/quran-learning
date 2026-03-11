/**
 * Extracts transliteration from Quran411 PDF and updates Supabase transliterations.text_hq.
 * Use when fetch-transliteration-quran411.ts fails (network blocked).
 *
 * Usage:
 *   npx tsx scripts/fetch-transliteration-from-pdf.ts "C:\path\to\quran411-transliteration.pdf"
 *   npx tsx scripts/fetch-transliteration-from-pdf.ts "C:\path\to\quran411-transliteration.pdf" --unicode
 */

import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env.local") });

const DELAY_MS = 50;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract all verse lines "N. transliteration" from PDF text. Skips surah titles (e.g. "1. Al-Fatiha (The Opening)"). */
function parseAllVersesFromText(text: string): { displayedNum: number; text: string }[] {
  const out: { displayedNum: number; text: string }[] = [];
  const re = /(\d+)\.\s+([^\n]+?)(?=\s*\d+\.|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    const t = m[2].replace(/\s+/g, " ").trim();
    if (n < 1 || n > 286 || t.length < 3) continue;
    if (/^Surah\s/i.test(t)) continue;
    if (/\(The\s/i.test(t)) continue;
    if (/^[A-Za-z][a-z'-]+\s+\(/i.test(t)) continue;
    out.push({ displayedNum: n, text: t });
  }
  return out;
}

function toUnicode(text: string): string {
  return text
    .replace(/Bismillaahir Rahmaanir Raheem/gi, "Bismillāhi r-raḥmāni r-raḥīm")
    .replace(/Rahmaanir Raheem/gi, "r-raḥmāni r-raḥīm")
    .replace(/lillaahi/gi, "li-llāhi")
    .replace(/Rabbil 'aalameen/gi, "Rabbi l-ʿālamīn")
    .replace(/'aalameen/gi, "ʿālamīn")
    .replace(/([a-zA-Z])aa([a-zA-Z])/g, "$1ā$2")
    .replace(/\baa\b/g, "ā")
    .replace(/([a-zA-Z])ee([a-zA-Z])/g, "$1ī$2")
    .replace(/\bee\b/g, "ī")
    .replace(/([a-zA-Z])oo([a-zA-Z])/g, "$1ū$2")
    .replace(/\boo\b/g, "ū")
    .replace(/\bii\b/g, "ī")
    .replace(/'/g, "ʿ");
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const convertToUnicode = process.argv.includes("--unicode");
  const pdfPath = args[0] ?? path.join(process.env.USERPROFILE ?? "", "OneDrive", "Desktop", "Quran app", "quran411-transliteration.pdf");

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`);
    console.error('Usage: npx tsx scripts/fetch-transliteration-from-pdf.ts "C:\\path\\to\\quran411-transliteration.pdf" [--unicode]');
    process.exit(1);
  }

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  console.log(`Reading PDF: ${pdfPath}`);
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const fullText = result.text ?? "";
  console.log(`Extracted ${fullText.length} chars from PDF.`);

  const allVerses = parseAllVersesFromText(fullText);
  console.log(`Parsed ${allVerses.length} verse lines.`);

  const supabase = createClient(url, key);
  const { data: surahRows } = await supabase.from("surahs").select("id, surah_number, ayah_count").order("surah_number", { ascending: true });
  if (!surahRows?.length) {
    console.error("No surahs in DB.");
    process.exit(1);
  }

  let verseIdx = 0;
  for (const surah of surahRows as { id: number; surah_number: number; ayah_count: number }[]) {
    const surahNumber = surah.surah_number;

    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, ayah_number_in_surah")
      .eq("surah_id", surah.id)
      .order("ayah_number_in_surah", { ascending: true });
    if (ayahErr || !ayahRows?.length) {
      console.warn(`Surah ${surahNumber}/114: no ayahs, skipping.`);
      continue;
    }

    const ayahIdByNumber = new Map((ayahRows as { id: number; ayah_number_in_surah: number }[]).map((r) => [r.ayah_number_in_surah, r.id]));
    const totalVersesActual = ayahRows.length;

    if (verseIdx >= allVerses.length && surahNumber > 1) {
      console.warn(`Surah ${surahNumber}/114: no parsed lines left (verseIdx=${verseIdx}, total=${allVerses.length}). PDF may use a different format for this surah.`);
    }

    let updated = 0;
    for (let i = 0; i < totalVersesActual && verseIdx < allVerses.length; i++, verseIdx++) {
      const { displayedNum, text } = allVerses[verseIdx];
      const ayahNumber = totalVersesActual + 1 - displayedNum;
      const ayahId = ayahIdByNumber.get(ayahNumber);
      if (!ayahId) continue;
      const finalText = convertToUnicode ? toUnicode(text) : text;
      const { error: updErr } = await supabase
        .from("transliterations")
        .update({ text_hq: finalText })
        .eq("ayah_id", ayahId)
        .eq("language_code", "standard");
      if (!updErr) updated++;
    }

    console.log(`Surah ${surahNumber}/114 done. Updated ${updated} ayahs.`);
    await delay(DELAY_MS);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
