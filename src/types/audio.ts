import type { Ayah } from "./quran";
import type { VerseTimestamp } from "./wordByWord";

/**
 * Where the playback queue came from. Only a whole-surah queue may continue
 * into the next surah when it ends; every other queue stops at its end.
 */
export type QueueSource = "surah" | "juz" | "learn" | "dua" | "single";

export interface PlayerState {
  currentSurahId: string | null;
  currentAyahId: string | null;
  isPlaying: boolean;
  queue: Ayah[];
  queueSource: QueueSource;
  currentTime: number;
  duration: number;
  activeAudioSrc: string | null;
  pendingSeekToSeconds: number | null;
  /** Word-by-word mode uses chapter-level audio from Quran.com API */
  wordByWordMode: boolean;
  /** Chapter-level audio URL (when wordByWordMode) */
  chapterAudioUrl: string | null;
  /** Verse timestamps for current chapter (when wordByWordMode) */
  chapterTimestamps: VerseTimestamp[] | null;
  /** Current playback position in ms (~60fps from rAF) */
  currentTimeMs: number;
}
