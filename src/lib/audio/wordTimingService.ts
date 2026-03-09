import type {
  ChapterAudioData,
  VerseTimestamp,
  WordData,
  WordTimingSegment,
} from "@/types/wordByWord";

const AUDIO_API = "https://api.qurancdn.com/api/qdc/audio/reciters/7/audio_files";
const VERSES_API = "https://api.quran.com/api/v4/verses/by_chapter";

/** Use proxy in browser to avoid CORS; direct URLs for server/tests. */
function getAudioApiUrl(surahNumber: number): string {
  if (typeof window !== "undefined") {
    return `/api/quran/chapter-audio?chapter=${surahNumber}`;
  }
  return `${AUDIO_API}?chapter=${surahNumber}&segments=true`;
}

function getVersesApiUrl(surahNumber: number): string {
  if (typeof window !== "undefined") {
    return `/api/quran/chapter-words?chapter=${surahNumber}`;
  }
  return `${VERSES_API}/${surahNumber}?language=en&words=true&word_fields=text_uthmani&per_page=300`;
}

const chapterAudioCache = new Map<number, ChapterAudioData>();
const wordDataCache = new Map<number, Map<string, WordData[]>>();

function mapTimestamp(ts: {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  segments?: number[][];
}): VerseTimestamp {
  return {
    verseKey: ts.verse_key,
    timestampFrom: ts.timestamp_from,
    timestampTo: ts.timestamp_to,
    segments: (ts.segments ?? []).map((seg: number[]) => ({
      wordPosition: seg[0],
      startMs: seg[1],
      endMs: seg[2],
    })),
  };
}

export async function fetchChapterAudioData(
  surahNumber: number
): Promise<ChapterAudioData> {
  const cached = chapterAudioCache.get(surahNumber);
  if (cached) return cached;

  const response = await fetch(getAudioApiUrl(surahNumber));
  if (!response.ok) {
    throw new Error(`Chapter audio fetch failed: ${response.status}`);
  }
  const data = await response.json();
  const audioFile = data.audio_file;
  if (!audioFile?.audio_url) {
    throw new Error("Invalid chapter audio response");
  }

  const result: ChapterAudioData = {
    chapterId: audioFile.chapter_id,
    audioUrl: audioFile.audio_url,
    timestamps: (audioFile.timestamps ?? []).map(mapTimestamp),
  };
  chapterAudioCache.set(surahNumber, result);
  return result;
}

export async function fetchWordData(
  surahNumber: number
): Promise<Map<string, WordData[]>> {
  const cached = wordDataCache.get(surahNumber);
  if (cached) return cached;

  const response = await fetch(getVersesApiUrl(surahNumber));
  if (!response.ok) {
    throw new Error(`Word data fetch failed: ${response.status}`);
  }
  const data = await response.json();
  const wordMap = new Map<string, WordData[]>();

  for (const verse of data.verses ?? []) {
    const words: WordData[] = (verse.words ?? [])
      .filter((w: { char_type_name?: string }) => w.char_type_name === "word")
      .map((w: Record<string, unknown>) => ({
        position: w.position as number,
        textUthmani: (w.text_uthmani as string) ?? "",
        transliteration: (w.transliteration as { text?: string })?.text ?? "",
        translation: (w.translation as { text?: string })?.text ?? "",
        charTypeName: (w.char_type_name as WordData["charTypeName"]) ?? "word",
      }));
    wordMap.set(verse.verse_key as string, words);
  }
  wordDataCache.set(surahNumber, wordMap);
  return wordMap;
}

export function clearWordTimingCache(): void {
  chapterAudioCache.clear();
  wordDataCache.clear();
}
