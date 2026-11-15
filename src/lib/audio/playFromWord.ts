import type { Ayah } from "@/types/quran";
import type { QueueSource } from "@/types/audio";
import { usePlayerStore } from "@/store/playerStore";
import * as audioManager from "./audioManager";

/** Start the shared audio element inside the user's click (mobile autoplay policies). */
function playInGesture(): void {
  const result = audioManager.play();
  if (result && typeof (result as Promise<void>).catch === "function") {
    void (result as Promise<void>).catch(() => {
      // The real source is loaded by AudioPlayer; a rejected prime is expected then.
    });
  }
}

/**
 * Word click in word-by-word mode: play `ayah` from `ayahRelativeMs`.
 * If that ayah's audio is loaded, seek in place (and resume when paused);
 * otherwise start it with a pending seek that AudioPlayer applies once it can.
 */
export function playAyahFromMs(
  ayah: Ayah,
  queue: Ayah[],
  ayahRelativeMs: number,
  queueSource: QueueSource = "surah",
): void {
  const state = usePlayerStore.getState();
  const seconds = ayahRelativeMs / 1000;
  if (state.currentAyahId === ayah.id && state.activeAudioSrc) {
    audioManager.seek(seconds);
    state.setCurrentTime(seconds);
    state.setCurrentTimeMs(Math.round(ayahRelativeMs));
    if (!state.isPlaying) {
      playInGesture();
      state.resume();
    }
    return;
  }
  playInGesture();
  state.setQueue(queue, queueSource);
  state.play(ayah);
  state.setPendingSeek(seconds);
}
