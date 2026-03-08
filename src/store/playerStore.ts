import { create } from "zustand";
import type { PlayerState } from "@/types/audio";
import type { Ayah } from "@/types/quran";

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
  setQueue: (ayahs: Ayah[]) => void;
  setCurrentAyah: (ayah: Ayah) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
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

  play: (ayah) => {
    const { queue } = get();
    const inQueue = queue.some((a) => a.id === ayah.id);
    set({
      currentSurahId: surahIdFromAyahId(ayah.id),
      currentAyahId: ayah.id,
      activeAudioSrc: ayah.audio?.url ?? null,
      isPlaying: true,
      queue: inQueue ? queue : [ayah],
    });
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
      activeAudioSrc: nextAyah.audio?.url ?? null,
      isPlaying: true,
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
      activeAudioSrc: prevAyah.audio?.url ?? null,
      isPlaying: true,
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

  stop: () => set({ isPlaying: false, activeAudioSrc: null }),
}));
