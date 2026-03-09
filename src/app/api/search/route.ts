import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { SearchResult } from "@/types/quran";

const CACHE_MAX_AGE = 3600; // 1h for search results
const MAX_RESULTS = 50;
const SNIPPET_LEN = 80;
const ARABIC_SNIPPET_LEN = 50;

function buildSnippet(
  fullText: string,
  query: string,
  maxLen: number
): { snippet: string; snippetHighlight: string } {
  if (!fullText || !query) {
    const plain = fullText.slice(0, maxLen);
    return { snippet: plain, snippetHighlight: plain };
  }
  const q = query.trim().toLowerCase();
  const lower = fullText.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) {
    const plain = fullText.slice(0, maxLen);
    return { snippet: plain, snippetHighlight: plain };
  }
  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const end = Math.min(fullText.length, start + maxLen);
  let segment = fullText.slice(start, end);
  const matchStart = idx - start;
  const matchEnd = matchStart + query.trim().length;
  const before = segment.slice(0, matchStart);
  const match = segment.slice(matchStart, matchEnd);
  const after = segment.slice(matchEnd);
  const snippetHighlight = `${before}<mark>${match}</mark>${after}`;
  return { snippet: segment, snippetHighlight };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { results: [], total: 0 },
      {
        headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
      }
    );
  }

  try {
    const supabase = getSupabaseClient();
    const qPattern = "%" + q.replace(/%/g, "\\%") + "%";

    // Collect ayah IDs from: ayahs (arabic_text), translations (bs), transliterations (standard)
    const [ayahsByArabic, transRows, transLitRows] = await Promise.all([
      supabase
        .from("ayahs")
        .select("id, surah_id, ayah_number_in_surah, arabic_text")
        .ilike("arabic_text", qPattern)
        .limit(MAX_RESULTS),
      supabase
        .from("translations")
        .select("ayah_id")
        .eq("language_code", "bs")
        .ilike("translation_text", qPattern)
        .limit(MAX_RESULTS),
      supabase
        .from("transliterations")
        .select("ayah_id")
        .eq("language_code", "standard")
        .ilike("text", qPattern)
        .limit(MAX_RESULTS),
    ]);

    type AyahHit = {
      id: number;
      surah_id: number;
      ayah_number_in_surah: number;
      arabic_text: string;
    };

    const ayahIds = new Set<number>();
    (ayahsByArabic.data ?? []).forEach((r: AyahHit) => ayahIds.add(r.id));
    (transRows.data ?? []).forEach((r: { ayah_id: number }) => ayahIds.add(r.ayah_id));
    (transLitRows.data ?? []).forEach((r: { ayah_id: number }) => ayahIds.add(r.ayah_id));

    if (ayahIds.size === 0) {
      return NextResponse.json(
        { results: [], total: 0 },
        {
          headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
        }
      );
    }

    // Fetch ayahs; then get surah names
    const { data: ayahRows, error: ayahErr } = await supabase
      .from("ayahs")
      .select("id, surah_id, ayah_number_in_surah, ayah_number_global, arabic_text")
      .in("id", Array.from(ayahIds))
      .order("ayah_number_global", { ascending: true })
      .limit(MAX_RESULTS);

    if (ayahErr || !ayahRows?.length) {
      return NextResponse.json(
        { results: [], total: 0 },
        {
          headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE },
        }
      );
    }

    const surahIds = [...new Set((ayahRows as { surah_id: number }[]).map((a) => a.surah_id))];
    const { data: surahRows } = await supabase
      .from("surahs")
      .select("id, surah_number, name_arabic, name_latin, name_bosnian")
      .in("id", surahIds);
    const surahById = new Map<number, { surah_number: number; name_arabic: string; name_latin: string; name_bosnian: string }>();
    (surahRows ?? []).forEach((s: { id: number; surah_number: number; name_arabic: string; name_latin: string; name_bosnian: string }) =>
      surahById.set(s.id, { surah_number: s.surah_number, name_arabic: s.name_arabic, name_latin: s.name_latin, name_bosnian: s.name_bosnian })
    );

    const ayahIdsList = ayahRows.map((a: { id: number }) => a.id);
    const [transData, transLitData] = await Promise.all([
      supabase
        .from("translations")
        .select("ayah_id, translation_text")
        .eq("language_code", "bs")
        .in("ayah_id", ayahIdsList),
      supabase
        .from("transliterations")
        .select("ayah_id, text")
        .eq("language_code", "standard")
        .in("ayah_id", ayahIdsList),
    ]);

    const transByAyah = new Map<number, string>();
    (transData.data ?? []).forEach((r: { ayah_id: number; translation_text: string }) =>
      transByAyah.set(r.ayah_id, r.translation_text)
    );
    const transLitByAyah = new Map<number, string>();
    (transLitData.data ?? []).forEach((r: { ayah_id: number; text: string }) =>
      transLitByAyah.set(r.ayah_id, r.text)
    );

    type Row = {
      id: number;
      surah_id: number;
      ayah_number_in_surah: number;
      ayah_number_global: number;
      arabic_text: string;
    };

    const results: SearchResult[] = (ayahRows as Row[]).map((row) => {
      const surahMeta = surahById.get(row.surah_id);
      const surahNumber = surahMeta?.surah_number ?? 0;
      const surahName = surahMeta?.name_bosnian || surahMeta?.name_latin || "";
      const translation = transByAyah.get(row.id) ?? "";
      const transliteration = transLitByAyah.get(row.id) ?? "";
      let snippetText = translation || transliteration || row.arabic_text;
      const { snippet, snippetHighlight } = buildSnippet(snippetText, q, SNIPPET_LEN);
      const arabicSnippet =
        row.arabic_text.length > ARABIC_SNIPPET_LEN
          ? row.arabic_text.slice(0, ARABIC_SNIPPET_LEN) + "…"
          : row.arabic_text;

      return {
        surahId: String(surahNumber),
        surahName,
        ayahNumber: row.ayah_number_in_surah,
        ayahId: `${surahNumber}:${row.ayah_number_in_surah}`,
        snippet,
        snippetHighlight,
        arabicSnippet,
      };
    });

    return NextResponse.json(
      { results, total: results.length },
      {
        headers: {
          "Cache-Control": "public, max-age=" + CACHE_MAX_AGE,
        },
      }
    );
  } catch (e) {
    console.error("API search:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
