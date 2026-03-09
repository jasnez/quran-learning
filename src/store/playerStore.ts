import { create } from "zustand";
import type { PlayerState } from "@/types/audio";
import type { Ayah } from "@/types/quran";
import type { VerseTimestamp } from "@/types/wordByWord";

const DEFAULT_RECITER = "mishary-alafasy";

/** Build relative audio path from ayah id (e.g. "1:1" -> "/audio/mishary-alafasy/001001.mp3") so getResolvedAudioUrl can resolve to CDN or everyayah. */
function defaultAudioUrlFromAyahId(ayahId: string): string {
  const [s, a] = ayahId.split(":").map(Number);
  const surah = (s ?? 1);
  const ayah = (a ?? 1);
  const pad = (n: number) => String(n).padStart(3, "0");
  return `/audio/${DEFAULT_RECITER}/${pad(surah)}${pad(ayah)}.mp3`;
}

function surahIdFromAyahId(ayahId: string): string {
  const parts = ayahId.split(":");
  return parts[0] ?? "";
}

type PlayerStore = PlayerState & {
  play: (ayah: Ayah) => void;
  pause: () => void;
  resume: () => void;
  next: () => boolean;
  previous: () => void;
  restartFromFirst: () => void;
  setQueue: (ayahs: Ayah[]) => void;
  setCurrentAyah: (ayah: Ayah) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setPendingSeek: (seconds: number | null) => void;
  setWordByWordMode: (enabled: boolean) => void;
  setChapterAudio: (url: string | null, timestamps: VerseTimestamp[] | null) => void;
  setCurrentTimeMs: (ms: number) => void;
  stop: () => void;
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSurahId: null,
  currentAyahId: null,
  isPlaying: false,
  queue: [],
  currentTime: 0,
  duration: 0,
  activeAudioSrc: null,
  pendingSeekToSeconds: null,
  wordByWordMode: false,
  chapterAudioUrl: null,
  chapterTimestamps: null,
  currentTimeMs: 0,

  play: (ayah) => {
    const { queue, wordByWordMode, chapterAudioUrl, chapterTimestamps } = get();
    const inQueue = queue.some((a) => a.id === ayah.id);
    let url: string;
    let pendingSeek: number | null = null;
    // Word-by-word: use ONE chapter-level MP3 and seek to verse start (timestamps are relative to chapter)
    if (wordByWordMode && chapterAudioUrl && chapterTimestamps?.length) {
      const verse = chapterTimestamps.find((t) => t.verseKey === ayah.id);
      if (verse) {
        url = chapterAudioUrl;
        pendingSeek = verse.timestampFrom / 1000;
      } else {
        url = (ayah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(ayah.id);
      }
    } else {
      url = (ayah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(ayah.id);
    }
    set({
      currentSurahId: surahIdFromAyahId(ayah.id),
      currentAyahId: ayah.id,
      activeAudioSrc: url || null,
      isPlaying: true,
      queue: inQueue ? queue : [ayah],
      pendingSeekToSeconds: pendingSeek,
    });
  },

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  next: () => {
    const { queue, currentAyahId, wordByWordMode, chapterAudioUrl, chapterTimestamps } = get();
    const idx = queue.findIndex((a) => a.id === currentAyahId);
    if (idx < 0 || idx >= queue.length - 1) {
      set({ isPlaying: false });
      return false;
    }
    const nextAyah = queue[idx + 1];
    let url: string;
    let pendingSeek: number | null = null;
    if (wordByWordMode && chapterAudioUrl && chapterTimestamps?.length) {
      const verse = chapterTimestamps.find((t) => t.verseKey === nextAyah.id);
      if (verse) {
        url = chapterAudioUrl;
        pendingSeek = verse.timestampFrom / 1000;
      } else {
        url = (nextAyah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(nextAyah.id);
      }
    } else {
      url = (nextAyah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(nextAyah.id);
    }
    set({
      currentSurahId: surahIdFromAyahId(nextAyah.id),
      currentAyahId: nextAyah.id,
      activeAudioSrc: url || null,
      isPlaying: true,
      pendingSeekToSeconds: pendingSeek,
    });
    return true;
  },

  previous: () => {
    const { queue, currentAyahId, wordByWordMode, chapterAudioUrl, chapterTimestamps } = get();
    const idx = queue.findIndex((a) => a.id === currentAyahId);
    if (idx <= 0) return;
    const prevAyah = queue[idx - 1];
    let url: string;
    let pendingSeek: number | null = null;
    if (wordByWordMode && chapterAudioUrl && chapterTimestamps?.length) {
      const verse = chapterTimestamps.find((t) => t.verseKey === prevAyah.id);
      if (verse) {
        url = chapterAudioUrl;
        pendingSeek = verse.timestampFrom / 1000;
      } else {
        url = (prevAyah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(prevAyah.id);
      }
    } else {
      url = (prevAyah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(prevAyah.id);
    }
    set({
      currentSurahId: surahIdFromAyahId(prevAyah.id),
      currentAyahId: prevAyah.id,
      activeAudioSrc: url || null,
      isPlaying: true,
      pendingSeekToSeconds: pendingSeek,
    });
  },

  restartFromFirst: () => {
    const { queue, wordByWordMode, chapterAudioUrl, chapterTimestamps } = get();
    if (queue.length === 0) return;
    const first = queue[0];
    let url: string;
    let pendingSeek: number | null = null;
    if (wordByWordMode && chapterAudioUrl && chapterTimestamps?.length) {
      const verse = chapterTimestamps.find((t) => t.verseKey === first.id);
      if (verse) {
        url = chapterAudioUrl;
        pendingSeek = verse.timestampFrom / 1000;
      } else {
        url = (first.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(first.id);
      }
    } else {
      url = (first.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(first.id);
    }
    set({
      currentSurahId: surahIdFromAyahId(first.id),
      currentAyahId: first.id,
      activeAudioSrc: url || null,
      isPlaying: true,
      pendingSeekToSeconds: pendingSeek,
    });
  },

  setQueue: (queue) => set({ queue }),

  setCurrentAyah: (ayah) =>
    set({
      currentSurahId: surahIdFromAyahId(ayah.id),
      currentAyahId: ayah.id,
      activeAudioSrc: null,
      isPlaying: false,
    }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setPendingSeek: (pendingSeekToSeconds) => set({ pendingSeekToSeconds }),

  setWordByWordMode: (wordByWordMode) => set((state) => ({
    wordByWordMode,
    ...(wordByWordMode ? {} : { chapterAudioUrl: null, chapterTimestamps: null }),
  })),

  setChapterAudio: (chapterAudioUrl, chapterTimestamps) =>
    set({ chapterAudioUrl, chapterTimestamps }),

  setCurrentTimeMs: (currentTimeMs) => set({ currentTimeMs }),

  stop: () => set({ isPlaying: false, activeAudioSrc: null }),
}));
