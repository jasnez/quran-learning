import type { Ayah } from "./quran";

export interface PlayerState {
  currentSurahId: string | null;
  currentAyahId: string | null;
  isPlaying: boolean;
  queue: Ayah[];
  currentTime: number;
  duration: number;
  activeAudioSrc: string | null;
  /** When set, AudioPlayer will seek to this time (seconds) on next frame and clear it. */
  pendingSeekToSeconds: number | null;
}
