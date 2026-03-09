"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";
import { getResolvedAudioUrl } from "@/lib/audio/getResolvedAudioUrl";

function ayahNumberFromId(ayahId: string | null): string {
  if (!ayahId) return "—";
  const parts = ayahId.split(":");
  return parts[1] ?? ayahId;
}

export function AudioPlayer() {
  const router = useRouter();
  const activeAudioSrc = usePlayerStore((s) => s.activeAudioSrc);
  const currentSurahId = usePlayerStore((s) => s.currentSurahId);
  const currentAyahId = usePlayerStore((s) => s.currentAyahId);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const resume = usePlayerStore((s) => s.resume);
  const pause = usePlayerStore((s) => s.pause);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setPendingSeek = usePlayerStore((s) => s.setPendingSeek);
  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs);

  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const autoPlayNext = useSettingsStore((s) => s.autoPlayNext);
  const cycleRepeatMode = useSettingsStore((s) => s.cycleRepeatMode);
  const toggleAutoPlayNext = useSettingsStore((s) => s.toggleAutoPlayNext);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);

  const restartFromFirst = usePlayerStore((s) => s.restartFromFirst);

  const prevSrcRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef(false);
  const listeningRef = useRef<{ lastTime: number; pendingMs: number }>({ lastTime: -1, pendingMs: 0 });

  // Sync audio element with store: load and play/pause
  useEffect(() => {
    const resolvedSrc = getResolvedAudioUrl(activeAudioSrc);
    if (!resolvedSrc) return;
    if (prevSrcRef.current !== resolvedSrc) {
      prevSrcRef.current = resolvedSrc;
      prevIsPlayingRef.current = isPlaying;
      listeningRef.current = { lastTime: -1, pendingMs: 0 };
      audioManager.loadAudio(resolvedSrc);
      audioManager.setPlaybackRate(playbackSpeed);
      if (isPlaying) {
        audioManager.play().catch(() => pause());
      } else {
        audioManager.pause();
      }
    } else {
      if (isPlaying !== prevIsPlayingRef.current) {
        prevIsPlayingRef.current = isPlaying;
        if (isPlaying) {
          audioManager.play().catch(() => pause());
        } else {
          audioManager.pause();
        }
      }
    }
    return () => {
      audioManager.pause();
    };
  }, [activeAudioSrc, isPlaying, pause]);

  // Apply pending seek when chapter audio is ready (critical for word-by-word: seek into long file)
  useEffect(() => {
    if (!activeAudioSrc) return;
    const pending = usePlayerStore.getState().pendingSeekToSeconds;
    if (pending == null) return;
    const unsub = audioManager.onCanSeek(() => {
      const state = usePlayerStore.getState();
      if (state.pendingSeekToSeconds != null) {
        state.setPendingSeek(null);
        audioManager.seek(state.pendingSeekToSeconds);
        setCurrentTime(state.pendingSeekToSeconds);
        setCurrentTimeMs(Math.floor(state.pendingSeekToSeconds * 1000));
      }
    });
    return unsub;
  }, [activeAudioSrc, setCurrentTime, setCurrentTimeMs]);

  // High-frequency time sync for word-by-word highlighting (~60fps when playing)
  useEffect(() => {
    if (!activeAudioSrc || !isPlaying) return;
    let rafId: number;
    const tick = () => {
      const p = usePlayerStore.getState().pendingSeekToSeconds;
      if (p != null) {
        usePlayerStore.getState().setPendingSeek(null);
        audioManager.seek(p);
        setCurrentTime(p);
      } else {
        const now = audioManager.getCurrentTime();
        setCurrentTime(now);
        setCurrentTimeMs(Math.floor(now * 1000));
      }
      const state = usePlayerStore.getState();
      if (state.wordByWordMode && state.chapterTimestamps?.length && state.currentAyahId) {
        const verse = state.chapterTimestamps.find((t) => t.verseKey === state.currentAyahId);
        const timeMs = Math.floor(audioManager.getCurrentTime() * 1000);
        if (verse && timeMs >= verse.timestampTo) {
          const advanced = state.next();
          if (advanced) {
            const nextVerse = state.chapterTimestamps.find((t) => t.verseKey === state.currentAyahId);
            if (nextVerse) {
              audioManager.seek(nextVerse.timestampFrom / 1000);
              state.setCurrentTime(nextVerse.timestampFrom / 1000);
              state.setCurrentTimeMs(nextVerse.timestampFrom);
            }
          } else {
            state.pause();
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeAudioSrc, isPlaying, setCurrentTime, setCurrentTimeMs]);

  // Time update and duration sync + listening time accumulation
  useEffect(() => {
    if (!activeAudioSrc) return;
    const onTimeUpdateHandler = () => {
      const now = audioManager.getCurrentTime();
      setCurrentTime(now);
      const d = audioManager.getDuration();
      if (Number.isFinite(d) && d > 0) setDuration(d);
      const playing = usePlayerStore.getState().isPlaying;
      const ref = listeningRef.current;
      if (playing) {
        if (ref.lastTime >= 0) {
          const delta = now - ref.lastTime;
          if (delta > 0 && delta < 120) ref.pendingMs += Math.round(delta * 1000);
        }
        ref.lastTime = now;
        if (ref.pendingMs >= 1000) {
          useProgressStore.getState().incrementListeningTime(ref.pendingMs);
          const surahId = usePlayerStore.getState().currentSurahId;
          if (surahId) {
            const num = parseInt(surahId, 10);
            if (Number.isInteger(num) && num >= 1) useProgressStore.getState().addSurahTimeSpent(num, ref.pendingMs);
          }
          ref.pendingMs = 0;
        }
      } else {
        ref.lastTime = -1;
        if (ref.pendingMs > 0) {
          useProgressStore.getState().incrementListeningTime(ref.pendingMs);
          const surahId = usePlayerStore.getState().currentSurahId;
          if (surahId) {
            const num = parseInt(surahId, 10);
            if (Number.isInteger(num) && num >= 1) useProgressStore.getState().addSurahTimeSpent(num, ref.pendingMs);
          }
          ref.pendingMs = 0;
        }
      }
    };
    const unsubscribe = audioManager.onTimeUpdate(onTimeUpdateHandler);
    onTimeUpdateHandler();
    return unsubscribe;
  }, [activeAudioSrc, setCurrentTime, setDuration]);

  // Ended: repeat or advance (ref updated in effect to avoid ref-as-render)
  // repeatMode: 'ayah' = repeat current ayah; 'surah' = at end of surah restart from first ayah; 'off' = advance or autoplay next surah.
  const onEndedRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onEndedRef.current = () => {
      if (repeatMode === "ayah") {
        audioManager.seek(0);
        audioManager.play().catch(() => pause());
        return;
      }
      useProgressStore.getState().incrementAyahsListened();
      const playerState = usePlayerStore.getState();
      const ayahId = playerState.currentAyahId;
      if (ayahId) {
        const [s, a] = ayahId.split(":").map(Number);
        const surahNum = s && !Number.isNaN(s) ? s : 0;
        const ayahNum = a && !Number.isNaN(a) ? a : 0;
        const queueLen = playerState.queue?.length ?? 0;
        if (surahNum >= 1 && ayahNum >= 1) {
          useProgressStore.getState().markAyahListened(surahNum, ayahNum, queueLen > 0 ? queueLen : undefined);
        }
      }
      const ref = listeningRef.current;
      if (ref.pendingMs > 0) {
        useProgressStore.getState().incrementListeningTime(ref.pendingMs);
        const surahId = usePlayerStore.getState().currentSurahId;
        if (surahId) {
          const num = parseInt(surahId, 10);
          if (Number.isInteger(num) && num >= 1) useProgressStore.getState().addSurahTimeSpent(num, ref.pendingMs);
        }
        ref.pendingMs = 0;
      }
      ref.lastTime = -1;
      const advanced = next();
      if (advanced) {
        return;
      }
      // Last ayah of surah ended
      if (repeatMode === "surah") {
        restartFromFirst();
        return;
      }
      if (autoPlayNext) {
        const surahNum = usePlayerStore.getState().currentSurahId;
        const num = surahNum ? parseInt(surahNum, 10) : 0;
        if (num >= 1 && num < 114) {
          router.push(`/surah/${num + 1}?autoplay=1`);
        } else {
          pause();
        }
      } else {
        pause();
      }
    };
  }, [repeatMode, autoPlayNext, next, pause, router, restartFromFirst]);
  useEffect(() => {
    if (!activeAudioSrc) return;
    const handler = () => onEndedRef.current?.();
    return audioManager.onEnded(handler);
  }, [activeAudioSrc, repeatMode, autoPlayNext, next, pause, restartFromFirst]);

  // Playback speed when setting changes
  useEffect(() => {
    if (activeAudioSrc) audioManager.setPlaybackRate(playbackSpeed);
  }, [activeAudioSrc, playbackSpeed]);

  if (!activeAudioSrc) return null;

  const ayahNum = ayahNumberFromId(currentAyahId);
  const safeDuration = duration > 0 ? duration : 1;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    audioManager.seek(value);
    setCurrentTime(value);
  };

  return (
    <div
      data-testid="audio-player"
      className="fixed left-0 right-0 z-40 max-h-[70px] border-t border-[var(--theme-border)] bg-[var(--theme-card)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/90 max-md:bottom-14 md:bottom-0"
      role="region"
      aria-label="Audio player"
    >
      <div className="mx-auto flex max-h-[70px] max-w-4xl flex-col justify-center px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex min-h-[44px] flex-1 items-center justify-between gap-2 md:gap-4">
          {/* Left: label (mobile: at start; desktop: at start) */}
          <div className="min-w-0 flex-shrink text-xs text-stone-500 dark:text-stone-400 md:text-sm">
            <span className="truncate">
              Surah {currentSurahId ?? "—"} · Ajah {ayahNum}
            </span>
          </div>

          {/* Right: controls (mobile and desktop) */}
          <div className="flex flex-shrink-0 items-center justify-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={previous}
              className="flex h-11 min-h-[44px] min-w-[44px] w-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
              aria-label="Prethodni ajah"
            >
              <PrevIcon />
            </button>
            <button
              type="button"
              onClick={isPlaying ? pause : resume}
              className="flex h-11 min-h-[44px] min-w-[44px] w-11 items-center justify-center rounded-full bg-stone-800 text-white hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
              aria-label={isPlaying ? "Pauza" : "Pusti"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              onClick={next}
              className="flex h-11 min-h-[44px] min-w-[44px] w-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
              aria-label="Sljedeći ajah"
            >
              <NextIcon />
            </button>
            <button
              type="button"
              onClick={cycleRepeatMode}
              aria-label={
                repeatMode === "off"
                  ? "Ponavljaj suru (prvi klik) ili ajet (drugi klik)"
                  : repeatMode === "surah"
                    ? "Ponavljanje sure (uključeno). Klik za ponavljanje ajeta."
                    : "Ponavljanje ajeta (uključeno). Klik za isključivanje."
              }
              aria-pressed={repeatMode !== "off"}
              className={`flex h-9 w-9 min-w-[36px] items-center justify-center rounded-full transition-colors md:h-10 md:w-10 md:min-w-[40px] ${
                repeatMode !== "off"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
              }`}
            >
              {repeatMode === "ayah" ? (
                <RepeatOneIcon className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <RepeatIcon className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleAutoPlayNext}
              aria-label={autoPlayNext ? "Sljedeća sura automatski (uključeno)" : "Uključi sljedeću suru automatski"}
              aria-pressed={autoPlayNext}
              className={`inline-flex h-9 w-14 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors md:h-10 md:w-16 ${
                autoPlayNext
                  ? "justify-end bg-stone-800 dark:bg-stone-200"
                  : "justify-start bg-stone-200 dark:bg-stone-600"
              }`}
            >
              <span
                data-autoplay-thumb
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-white shadow md:h-8 md:w-8 dark:bg-stone-200 dark:text-stone-900"
                aria-hidden
              >
                <PlayIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full px-1 pb-1 md:px-2 md:pb-1.5">
          <input
            type="range"
            min={0}
            max={safeDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 transition-[width] duration-150 ease-out dark:bg-stone-600 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-700 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:dark:bg-stone-300"
            aria-label="Trajanje"
          />
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-5 w-5 md:h-6 md:w-6"} aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 md:h-6 md:w-6" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 md:h-6 md:w-6" aria-hidden>
      <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 md:h-6 md:w-6" aria-hidden>
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}

/** Repeat-one icon: loop with "1" in center (for repeat ayah state). */
function RepeatOneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
      <text x="12" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" fontFamily="system-ui, sans-serif">
        1
      </text>
    </svg>
  );
}
