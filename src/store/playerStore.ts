import { create } from "zustand";
import type { PlayerState, QueueSource } from "@/types/audio";
import type { Ayah } from "@/types/quran";

const DEFAULT_RECITER = "mishary-alafasy";

/** Build relative audio path from ayah id (e.g. "1:1" -> "/audio/mishary-alafasy/001001.mp3") so getResolvedAudioUrl can resolve to CDN or everyayah. */
function defaultAudioUrlFromAyahId(ayahId: string): string {
  const [s, a] = ayahId.split(":").map(Number);
  const surah = (s ?? 1);
  const ayah = (a ?? 1);
  const pad = (n: number) => String(n).padStart(3, "0");
  return `/audio/${DEFAULT_RECITER}/${pad(surah)}${pad(ayah)}.mp3`;
}

/** Minimal Ayah for playback from verse key only (e.g. for dova). */
function minimalAyahFromId(ayahId: string): Ayah {
  return {
    id: ayahId,
    ayahNumber: 1,
    ayahNumberGlobal: 1,
    juz: 1,
    page: 1,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: DEFAULT_RECITER, url: "", durationMs: 0 },
  };
}

/** Per-ayah audio file (everyayah cut of the same recording); also used in word-by-word mode. */
function ayahAudioUrl(ayah: Ayah): string {
  return (ayah.audio?.url ?? "").trim() || defaultAudioUrlFromAyahId(ayah.id);
}

function surahIdFromAyahId(ayahId: string): string {
  const parts = ayahId.split(":");
  return parts[0] ?? "";
}

type PlayerStore = PlayerState & {
  play: (ayah: Ayah) => void;
  /** Play one or more ayahs by id (e.g. for dova: single verse or merged 3:191–194). Uses default reciter. */
  playAyahIds: (ayahIds: string[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => boolean;
  previous: () => void;
  restartFromFirst: () => void;
  /** Replaces the queue; `source` defaults to a whole-surah queue. */
  setQueue: (ayahs: Ayah[], source?: QueueSource) => void;
  setCurrentAyah: (ayah: Ayah) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setPendingSeek: (seconds: number | null) => void;
  setWordByWordMode: (enabled: boolean) => void;
  setCurrentTimeMs: (ms: number) => void;
  stop: () => void;
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSurahId: null,
  currentAyahId: null,
  isPlaying: false,
  queue: [],
  queueSource: "surah",
  currentTime: 0,
  duration: 0,
  activeAudioSrc: null,
  pendingSeekToSeconds: null,
  wordByWordMode: false,
  currentTimeMs: 0,

  play: (ayah) => {
    const { queue } = get();
    const inQueue = queue.some((a) => a.id === ayah.id);
    set({
      currentSurahId: surahIdFromAyahId(ayah.id),
      currentAyahId: ayah.id,
      activeAudioSrc: ayahAudioUrl(ayah) || null,
      isPlaying: true,
      currentTime: 0,
      currentTimeMs: 0,
      ...(inQueue ? {} : { queue: [ayah], queueSource: "single" as const }),
      pendingSeekToSeconds: null,
    });
  },

  playAyahIds: (ayahIds) => {
    if (ayahIds.length === 0) return;
    const ayahs = ayahIds.map(minimalAyahFromId);
    get().setQueue(ayahs, "dua");
    get().play(ayahs[0]);
  },

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  next: () => {
    const { queue, currentAyahId } = get();
    const idx = queue.findIndex((a) => a.id === currentAyahId);
    if (idx < 0 || idx >= queue.length - 1) {
      set({ isPlaying: false });
      return false;
    }
    const nextAyah = queue[idx + 1];
    set({
      currentSurahId: surahIdFromAyahId(nextAyah.id),
      currentAyahId: nextAyah.id,
      activeAudioSrc: ayahAudioUrl(nextAyah) || null,
      isPlaying: true,
      currentTime: 0,
      currentTimeMs: 0,
      pendingSeekToSeconds: null,
    });
    return true;
  },

  previous: () => {
    const { queue, currentAyahId } = get();
    const idx = queue.findIndex((a) => a.id === currentAyahId);
    if (idx <= 0) return;
    const prevAyah = queue[idx - 1];
    set({
      currentSurahId: surahIdFromAyahId(prevAyah.id),
      currentAyahId: prevAyah.id,
      activeAudioSrc: ayahAudioUrl(prevAyah) || null,
      isPlaying: true,
      currentTime: 0,
      currentTimeMs: 0,
      pendingSeekToSeconds: null,
    });
  },

  restartFromFirst: () => {
    const { queue } = get();
    if (queue.length === 0) return;
    const first = queue[0];
    set({
      currentSurahId: surahIdFromAyahId(first.id),
      currentAyahId: first.id,
      activeAudioSrc: ayahAudioUrl(first) || null,
      isPlaying: true,
      currentTime: 0,
      currentTimeMs: 0,
      pendingSeekToSeconds: null,
    });
  },

  setQueue: (queue, source = "surah") => set({ queue, queueSource: source }),

  setCurrentAyah: (ayah) =>
    set({
      currentSurahId: surahIdFromAyahId(ayah.id),
      currentAyahId: ayah.id,
      activeAudioSrc: null,
      isPlaying: false,
      currentTime: 0,
      currentTimeMs: 0,
    }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setPendingSeek: (pendingSeekToSeconds) => set({ pendingSeekToSeconds }),

  setWordByWordMode: (wordByWordMode) => set({ wordByWordMode }),

  setCurrentTimeMs: (currentTimeMs) => set({ currentTimeMs }),

  stop: () => set({ isPlaying: false, activeAudioSrc: null }),
}));
