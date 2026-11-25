"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useProgressStore } from "@/store/progressStore";
import * as audioManager from "@/lib/audio/audioManager";
import { getResolvedAudioUrl } from "@/lib/audio/getResolvedAudioUrl";
import surahsData from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { spokenPosition } from "@/lib/spokenDuration";
import { MoreVertical } from "lucide-react";
import type { RepeatMode } from "@/types/settings";
import { ChoiceGroup, Switch } from "@/components/ui";
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPrevIcon, StopIcon } from "@/components/ui/icons";

const CONTROL_BUTTON =
  "flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-press ease-standard hover:bg-surface-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";

function ayahNumberFromId(ayahId: string | null): string {
  if (!ayahId) return "—";
  const parts = ayahId.split(":");
  return parts[1] ?? ayahId;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const stop = usePlayerStore((s) => s.stop);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs);
  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);

  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const autoPlayNext = useSettingsStore((s) => s.autoPlayNext);
  const pauseAfterAyah = useSettingsStore((s) => s.pauseAfterAyah);
  const setRepeatMode = useSettingsStore((s) => s.setRepeatMode);
  const toggleAutoPlayNext = useSettingsStore((s) => s.toggleAutoPlayNext);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);

  const restartFromFirst = usePlayerStore((s) => s.restartFromFirst);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const prevSrcRef = useRef<string | null>(null);
  const prevIsPlayingRef = useRef(false);
  const listeningRef = useRef<{ lastTime: number; pendingMs: number }>({ lastTime: -1, pendingMs: 0 });

  // Pause-after-ayah state
  const [isAwaitingContinue, setIsAwaitingContinue] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const pendingAdvanceFnRef = useRef<(() => void) | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isWaitingRef = useRef(false);
  const pauseAfterAyahRef = useRef(pauseAfterAyah);
  useEffect(() => { pauseAfterAyahRef.current = pauseAfterAyah; }, [pauseAfterAyah]);

  const clearPending = useCallback(() => {
    if (advanceTimerRef.current != null) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (countdownIntervalRef.current != null) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    isWaitingRef.current = false;
    pendingAdvanceFnRef.current = null;
    setIsAwaitingContinue(false);
    setCountdown(null);
  }, []);

  const firePending = useCallback(() => {
    if (advanceTimerRef.current != null) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (countdownIntervalRef.current != null) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    isWaitingRef.current = false;
    setIsAwaitingContinue(false);
    setCountdown(null);
    const fn = pendingAdvanceFnRef.current;
    pendingAdvanceFnRef.current = null;
    fn?.();
  }, []);

  const scheduleAdvance = useCallback((advanceFn: () => void) => {
    const mode = pauseAfterAyahRef.current;
    if (mode === "off") { advanceFn(); return; }
    isWaitingRef.current = true;
    pendingAdvanceFnRef.current = advanceFn;
    setIsAwaitingContinue(true);
    if (mode === "manual") return;
    const secs = mode === "3s" ? 3 : mode === "5s" ? 5 : 10;
    setCountdown(secs);
    let rem = secs;
    countdownIntervalRef.current = setInterval(() => {
      rem -= 1;
      setCountdown(rem > 0 ? rem : null);
      if (rem <= 0) { clearInterval(countdownIntervalRef.current!); countdownIntervalRef.current = null; }
    }, 1000);
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      isWaitingRef.current = false;
      setIsAwaitingContinue(false);
      setCountdown(null);
      const fn = pendingAdvanceFnRef.current;
      pendingAdvanceFnRef.current = null;
      fn?.();
    }, secs * 1000);
  }, []);

  // Another ayah chosen outside the player bar (learn mode prev/next, a card's play button) while
  // waiting between ayahs: drop the pending advance, or it would skip the chosen ayah.
  // The advance itself clears the pending state before it moves to the next ayah.
  useEffect(() => {
    if (isWaitingRef.current) clearPending();
  }, [currentAyahId, clearPending]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current != null) clearTimeout(advanceTimerRef.current);
      if (countdownIntervalRef.current != null) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Sync audio element with store: load and play/pause
  useEffect(() => {
    const resolvedSrc = getResolvedAudioUrl(activeAudioSrc);
    if (!resolvedSrc) {
      // Stopped (source cleared): forget the previous source so playing the
      // same source again is treated as a fresh load and actually plays.
      prevSrcRef.current = null;
      prevIsPlayingRef.current = false;
      return;
    }
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
    // playbackSpeed namjerno NIJE u deps — promjena brzine ne smije pokrenuti cleanup
    // (audioManager.pause), inače bi se audio prekidao pri svakoj promjeni brzine.
    // Brzina se primjenjuje u zasebnom efektu (vidi dolje).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAudioSrc, isPlaying, pause]);

  // Apply a pending seek (word click on an ayah that is not loaded yet) once the new source can seek.
  // Event-driven, so it also works in a background tab where rAF does not run.
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
        setCurrentTimeMs(Math.round(state.pendingSeekToSeconds * 1000));
      }
    });
    return unsub;
  }, [activeAudioSrc, setCurrentTime, setCurrentTimeMs]);

  // High-frequency time sync for word-by-word highlighting (~60fps while playing and visible).
  // Only updates the time: ayah boundaries, repeat and pause run on the media "ended"
  // event, which keeps working when rAF stops in a background tab (QA P1-10).
  // Word-by-word only: each write re-renders the player and lays out the whole surah page,
  // and "Po ajetu" needs no more than timeupdate (~4 Hz) for the slider (QA section 6).
  useEffect(() => {
    if (!activeAudioSrc || !isPlaying || !wordByWordMode) return;
    let rafId: number;
    const tick = () => {
      const now = audioManager.getCurrentTime();
      setCurrentTime(now);
      setCurrentTimeMs(Math.floor(now * 1000));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeAudioSrc, isPlaying, wordByWordMode, setCurrentTime, setCurrentTimeMs]);

  // Time update and duration sync + listening time accumulation
  useEffect(() => {
    if (!activeAudioSrc) return;
    const onTimeUpdateHandler = () => {
      const now = audioManager.getCurrentTime();
      setCurrentTime(now);
      // Keeps the word time current without the rAF loop, e.g. for a switch to word-by-word.
      setCurrentTimeMs(Math.floor(now * 1000));
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
    // A new source: forget the previous ayah's duration and take the new one as soon as the
    // metadata loads, also while paused (no timeupdate then).
    setDuration(0);
    const onDurationChangeHandler = () => {
      const d = audioManager.getDuration();
      if (Number.isFinite(d) && d > 0) setDuration(d);
    };
    const unsubscribe = audioManager.onTimeUpdate(onTimeUpdateHandler);
    const unsubscribeDuration = audioManager.onDurationChange(onDurationChangeHandler);
    onTimeUpdateHandler();
    return () => {
      unsubscribe();
      unsubscribeDuration();
    };
  }, [activeAudioSrc, setCurrentTime, setCurrentTimeMs, setDuration]);

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
        if (surahNum >= 1 && ayahNum >= 1) {
          useProgressStore.getState().markAyahListened(surahNum, ayahNum);
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

      const doAdvance = () => {
        const advanced = next();
        if (advanced) return;
        // Last ayah of the queue ended
        if (repeatMode === "surah") {
          restartFromFirst();
          return;
        }
        // Only a whole-surah queue continues into the next surah; a dua, juz segment or learn session stops here.
        if (autoPlayNext && usePlayerStore.getState().queueSource === "surah") {
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

      scheduleAdvance(doAdvance);
    };
  }, [repeatMode, autoPlayNext, next, pause, router, restartFromFirst, scheduleAdvance]);
  useEffect(() => {
    if (!activeAudioSrc) return;
    const handler = () => onEndedRef.current?.();
    return audioManager.onEnded(handler);
  }, [activeAudioSrc]);

  // Playback speed when setting changes
  useEffect(() => {
    if (activeAudioSrc) audioManager.setPlaybackRate(playbackSpeed);
  }, [activeAudioSrc, playbackSpeed]);

  const surahName = useMemo(() => {
    if (currentSurahId == null) return null;
    const n = Number(currentSurahId);
    if (!Number.isFinite(n)) return null;
    const surah = (surahsData as SurahSummary[]).find((s) => s.surahNumber === n);
    return surah?.nameLatin ?? null;
  }, [currentSurahId]);

  // "Nastavi učenje" follows the ayah that is actually playing, also after an automatic
  // move to the next ayah (QA P2-1). A dua is not a place in the Quran to return to.
  useEffect(() => {
    if (!isPlaying || !currentAyahId) return;
    const { queueSource } = usePlayerStore.getState();
    if (queueSource === "dua") return;
    const [surahNum, ayahNum] = currentAyahId.split(":").map(Number);
    if (!(surahNum >= 1 && ayahNum >= 1)) return;
    useProgressStore
      .getState()
      .updateLastPosition(surahNum, ayahNum, surahName ?? "", queueSource === "learn" ? "learning" : "reader");
  }, [currentAyahId, isPlaying, surahName]);

  if (!activeAudioSrc) return null;

  const ayahNum = ayahNumberFromId(currentAyahId);
  const safeDuration = duration > 0 ? duration : 1;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value);
    audioManager.seek(value);
    setCurrentTime(value);
    // The word highlight reads currentTimeMs; rAF does not update it while paused.
    setCurrentTimeMs(Math.round(value * 1000));
  };

  return (
    <div
      data-testid="audio-player"
      data-audio-player=""
      className="fixed left-0 right-0 bottom-[var(--bar-nav-now)] z-player h-[var(--bar-player)] border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90"
      role="region"
      aria-label="Kontrole zvuka"
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-3 md:px-4">
        <div className="flex min-h-11 items-center justify-between gap-2 md:gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Left: label (mobile: at start; desktop: at start) */}
          <div className="flex min-w-0 flex-1 flex-col leading-tight lg:flex-none lg:justify-self-start">
            <span className="truncate text-sm font-medium text-ink md:text-[15px]">
              {surahName ? `${surahName}, ${ayahNum}. ajet` : `Sura ${currentSurahId ?? "—"}, ${ayahNum}. ajet`}
            </span>
            <span className="truncate text-[11px] tabular-nums text-ink-muted md:text-xs">
              {formatTime(currentTime)} / {formatTime(duration)} · Mishary Alafasy
              {/* Repeat has no button in the bar, so the bar says when it is on. */}
              {repeatMode !== "off" && ` · Ponavljanje: ${repeatStateWord(repeatMode)}`}
            </span>
          </div>

          {/* Center: controls (mobile right-aligned, desktop centered) */}
          <div className="relative flex flex-shrink-0 items-center justify-center gap-1 md:gap-2 lg:justify-self-center">
            <button
              type="button"
              onClick={() => { clearPending(); previous(); }}
              className={CONTROL_BUTTON}
              aria-label="Prethodni ajet"
            >
              <SkipPrevIcon />
            </button>
            {isAwaitingContinue ? (
              <button
                type="button"
                onClick={firePending}
                className="flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover"
                aria-label="Nastavi na sljedeći ajet"
              >
                <span>{countdown != null ? `${countdown}s` : "Nastavi"}</span>
                <SkipNextIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={isPlaying ? pause : resume}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent transition-colors duration-press ease-standard hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
                aria-label={isPlaying ? "Pauziraj" : "Pusti"}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            )}
            <button
              type="button"
              onClick={() => { clearPending(); next(); }}
              className={CONTROL_BUTTON}
              aria-label="Sljedeći ajet"
            >
              <SkipNextIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                clearPending();
                audioManager.pause();
                stop();
              }}
              className={CONTROL_BUTTON}
              aria-label="Zaustavi"
            >
              <StopIcon />
            </button>
            {/* Repeat and going on to the next surah: in the options, on every width. */}
            <MoreMenu
              isOpen={isMoreOpen}
              onToggle={() => setIsMoreOpen((v) => !v)}
              repeatMode={repeatMode}
              autoPlayNext={autoPlayNext}
              onRepeatMode={setRepeatMode}
              onToggleAutoPlayNext={toggleAutoPlayNext}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full px-1 md:px-2">
          <input
            type="range"
            min={0}
            max={safeDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-valuetext={spokenPosition(currentTime, duration)}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken transition-[width] duration-150 ease-out [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150"
            aria-label="Mjesto u ajetu"
          />
        </div>
      </div>
    </div>
  );
}

const REPEAT_OPTIONS = [
  { value: "off", label: "Isključeno" },
  { value: "surah", label: "Sura" },
  { value: "ayah", label: "Ajet" },
] as const;

type MoreMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  repeatMode: RepeatMode;
  autoPlayNext: boolean;
  onRepeatMode: (mode: RepeatMode) => void;
  onToggleAutoPlayNext: () => void;
};

/**
 * Repeat and going on to the next surah. A disclosure that holds a choice and a switch: not
 * role="menu", which promises arrow keys between items (QA section 5).
 */
function MoreMenu({ isOpen, onToggle, repeatMode, autoPlayNext, onRepeatMode, onToggleAutoPlayNext }: MoreMenuProps) {
  const panelId = useId();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label="Više opcija zvuka"
        className={CONTROL_BUTTON}
      >
        <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>
      {isOpen && (
        <div
          id={panelId}
          className="absolute bottom-full right-0 z-float mb-2 w-64 space-y-3 rounded-card border border-line bg-surface p-3 shadow-lg"
          role="group"
          aria-label="Dodatne kontrole zvuka"
        >
          <ChoiceGroup legend="Ponavljanje" name="player-repeat-mode" options={REPEAT_OPTIONS} value={repeatMode} onChange={onRepeatMode} />
          <Switch label="Pusti sljedeću suru" checked={autoPlayNext} onChange={onToggleAutoPlayNext} />
        </div>
      )}
    </div>
  );
}

/** The repeat mode as a word, for the line in the bar that says repeat is on. */
function repeatStateWord(mode: RepeatMode): string {
  return mode === "ayah" ? "ajet" : mode === "surah" ? "sura" : "isključeno";
}
