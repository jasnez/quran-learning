/**
 * @vitest-environment jsdom
 *
 * QA P2-1: the "Nastavi učenje" position follows the ayah that is actually
 * playing, including the automatic move to the next ayah, not only the ayah
 * whose "Pusti" button was clicked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { AudioPlayer } from "../AudioPlayer";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { QueueSource } from "@/types/audio";
import type { Ayah } from "@/types/quran";

// The "ended" listener of the loaded ayah; AudioPlayer registers a new one per source.
const audio = vi.hoisted(() => ({ onEnded: null as (() => void) | null }));
vi.mock("@/lib/audio/audioManager", () => ({
  loadAudio: vi.fn(),
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  seek: vi.fn(),
  setPlaybackRate: vi.fn(),
  getCurrentTime: () => 0,
  getDuration: () => 0,
  onTimeUpdate: () => () => {},
  onDurationChange: () => () => {},
  onCanSeek: () => () => {},
  onEnded: (cb: () => void) => {
    audio.onEnded = cb;
    return () => {
      if (audio.onEnded === cb) audio.onEnded = null;
    };
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const ayah = (surahNumber: number, n: number): Ayah =>
  ({
    id: `${surahNumber}:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: n,
    juz: 1,
    page: 1,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const baqarah = [ayah(2, 1), ayah(2, 2), ayah(2, 3)];

function startPlayback(queue: Ayah[], source: QueueSource) {
  act(() => {
    usePlayerStore.getState().setQueue(queue, source);
    usePlayerStore.getState().play(queue[0]);
  });
}

function endCurrentAyah() {
  act(() => audio.onEnded?.());
}

function lastPosition() {
  const { lastSurahNumber, lastAyahNumber, lastMode } = useProgressStore.getState();
  return { lastSurahNumber, lastAyahNumber, lastMode };
}

describe("AudioPlayer and the continue position", () => {
  beforeEach(() => {
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useProgressStore.setState(useProgressStore.getInitialState(), true);
    useSettingsStore.setState({ repeatMode: "off", autoPlayNext: true, pauseAfterAyah: "off" });
    localStorage.clear();
    audio.onEnded = null;
  });

  afterEach(cleanup);

  it("moves the reading position along when playback advances to the next ayah", () => {
    render(<AudioPlayer />);
    startPlayback(baqarah, "surah");
    endCurrentAyah();
    expect(usePlayerStore.getState().currentAyahId).toBe("2:2");
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 2, lastMode: "reader" });
    endCurrentAyah();
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 3, lastMode: "reader" });
  });

  it("saves the position in learning mode when the learn queue advances", () => {
    render(<AudioPlayer />);
    startPlayback(baqarah, "learn");
    endCurrentAyah();
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 2, lastMode: "learning" });
  });

  it("leaves the position alone while a dua plays", () => {
    act(() => useProgressStore.getState().updateLastPosition(1, 7, "Al-Fatihah", "reader"));
    render(<AudioPlayer />);
    act(() => usePlayerStore.getState().playAyahIds(["2:201"]));
    endCurrentAyah();
    expect(lastPosition()).toEqual({ lastSurahNumber: 1, lastAyahNumber: 7, lastMode: "reader" });
  });
});
