import { getSupabaseClient } from "@/lib/supabase";

const cache = new Map<string, number>();

function keyFor(surahNumber: number, ayahNumberInSurah: number): string {
  return `${surahNumber}:${ayahNumberInSurah}`;
}

/**
 * Returns the database ayah_id (primary key in ayahs table)
 * for a given (surahNumber, ayahNumberInSurah) pair.
 * Uses an in-memory cache per process to minimize Supabase queries.
 */
export async function getAyahId(
  surahNumber: number,
  ayahNumberInSurah: number
): Promise<number | null> {
  const key = keyFor(surahNumber, ayahNumberInSurah);
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const supabase = getSupabaseClient();

  // First fetch the internal surah id for this surah number.
  const { data: surahRow, error: surahErr } = await supabase
    .from("surahs")
    .select("id")
    .eq("surah_number", surahNumber)
    .maybeSingle();

  if (surahErr || !surahRow) {
    return null;
  }

  const surahId = (surahRow as { id: number }).id;

  // Fetch all ayahs for this surah once, so we can cache mapping.
  const { data: ayahRows, error: ayahErr } = await supabase
    .from("ayahs")
    .select("id, ayah_number_in_surah")
    .eq("surah_id", surahId);

  if (ayahErr || !ayahRows) {
    return null;
  }

  for (const row of ayahRows as { id: number; ayah_number_in_surah: number }[]) {
    const rowKey = keyFor(surahNumber, row.ayah_number_in_surah);
    if (!cache.has(rowKey)) {
      cache.set(rowKey, row.id);
    }
  }

  return cache.get(key) ?? null;
}

export function __clearAyahIdCacheForTests() {
  cache.clear();
}

