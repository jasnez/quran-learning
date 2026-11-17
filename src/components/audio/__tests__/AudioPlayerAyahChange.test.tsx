/**
 * @vitest-environment jsdom
 *
 * Moving to another ayah from outside the player bar (learn mode prev/next)
 * while the player waits between ayahs, or while it is paused.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { AudioPlayer } from "../AudioPlayer";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { Ayah } from "@/types/quran";

// Fake media element: the "ended" and "durationchange" listeners of the loaded source and its duration.
const audio = vi.hoisted(() => ({
  onEnded: null as (() => void) | null,
  onDurationChange: null as (() => void) | null,
  duration: NaN,
}));
vi.mock("@/lib/audio/audioManager", () => ({
  loadAudio: vi.fn(() => {
    audio.duration = NaN; // a new source has no duration until its metadata loads
  }),
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  seek: vi.fn(),
  setPlaybackRate: vi.fn(),
  getCurrentTime: () => 0,
  getDuration: () => audio.duration,
  onTimeUpdate: () => () => {},
  onCanSeek: () => () => {},
  onEnded: (cb: () => void) => {
    audio.onEnded = cb;
    return () => {
      if (audio.onEnded === cb) audio.onEnded = null;
    };
  },
  onDurationChange: (cb: () => void) => {
    audio.onDurationChange = cb;
    return () => {
      if (audio.onDurationChange === cb) audio.onDurationChange = null;
    };
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const ayah = (n: number): Ayah =>
  ({
    id: `2:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: 7 + n,
    juz: 1,
    page: 2,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const ayahs = [ayah(1), ayah(2), ayah(3), ayah(4)];

function metadataLoaded(seconds: number) {
  act(() => {
    audio.duration = seconds;
    audio.onDurationChange?.();
  });
}

describe("AudioPlayer when the ayah changes from outside the player bar", () => {
  beforeEach(() => {
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useProgressStore.setState(useProgressStore.getInitialState(), true);
    useSettingsStore.setState({ repeatMode: "off", autoPlayNext: true, pauseAfterAyah: "off" });
    localStorage.clear();
    Object.assign(audio, { onEnded: null, onDurationChange: null, duration: NaN });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("cancels the pending pause-after-ayah advance, so the chosen ayah is not skipped", () => {
    vi.useFakeTimers();
    useSettingsStore.setState({ pauseAfterAyah: "3s" });
    render(<AudioPlayer />);
    act(() => {
      usePlayerStore.getState().setQueue(ayahs, "learn");
      usePlayerStore.getState().play(ayahs[0]);
    });
    act(() => audio.onEnded?.());
    expect(screen.getByRole("button", { name: "Nastavi na sljedeći ajet" })).toBeInTheDocument();

    // Learn mode "Sljedeći ajet" during the countdown.
    act(() => usePlayerStore.getState().goToAyah(ayahs[1]));
    act(() => vi.advanceTimersByTime(3500));

    expect(usePlayerStore.getState().currentAyahId).toBe("2:2");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(screen.queryByRole("button", { name: "Nastavi na sljedeći ajet" })).not.toBeInTheDocument();
  });

  it("shows the duration of the new ayah while paused, not the previous one", () => {
    render(<AudioPlayer />);
    act(() => {
      usePlayerStore.getState().setQueue(ayahs, "learn");
      usePlayerStore.getState().play(ayahs[0]);
    });
    metadataLoaded(35);
    expect(screen.getByText(/0:00 \/ 0:35/)).toBeInTheDocument();

    act(() => {
      usePlayerStore.getState().pause();
      usePlayerStore.getState().goToAyah(ayahs[1]);
    });
    expect(screen.getByText(/0:00 \/ 0:00/)).toBeInTheDocument();
    metadataLoaded(24);
    expect(screen.getByText(/0:00 \/ 0:24/)).toBeInTheDocument();
  });
});
