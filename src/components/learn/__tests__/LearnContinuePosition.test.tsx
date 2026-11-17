/**
 * @vitest-environment jsdom
 *
 * QA P2-1: learn mode opens at ?ayah=N (the "Učenje" button of the home card)
 * and saves the ayah being learned as the "Nastavi učenje" position.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnModeContent } from "../LearnModeContent";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import type { Ayah, SurahSummary } from "@/types/quran";

const url = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(url.search),
}));
vi.mock("@/lib/audio/audioManager", () => ({
  play: () => Promise.resolve(),
  pause: () => {},
  seek: () => {},
}));

const surah: SurahSummary = {
  id: "2",
  surahNumber: 2,
  slug: "al-baqarah",
  nameArabic: "البقرة",
  nameLatin: "El-Bekare",
  nameBosnian: "Krava",
  revelationType: "medinan",
  ayahCount: 3,
};

const ayah = (n: number): Ayah =>
  ({
    id: `2:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: 7 + n,
    juz: 1,
    page: 2,
    arabicText: "الٓمٓ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [{ text: "الٓمٓ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const ayahs = [ayah(1), ayah(2), ayah(3)];

function lastPosition() {
  const { lastSurahNumber, lastAyahNumber, lastMode } = useProgressStore.getState();
  return { lastSurahNumber, lastAyahNumber, lastMode };
}

describe("LearnModeContent and the continue position", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })));
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useProgressStore.setState(useProgressStore.getInitialState(), true);
    localStorage.clear();
    url.search = "";
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens at the ayah given by ?ayah", () => {
    url.search = "ayah=2";
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(screen.getByText("Ajet 2 od 3")).toBeInTheDocument();
    expect(usePlayerStore.getState().currentAyahId).toBe("2:2");
  });

  it("saves the ayah opened from ?ayah as the learning position", () => {
    url.search = "ayah=3";
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 3, lastMode: "learning" });
  });

  it("does not count ayah 1 as read when it opens at ?ayah", () => {
    url.search = "ayah=3";
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect([...useProgressStore.getState().surahProgressMap[2].ayahsRead]).toEqual([3]);
  });

  it("moves audio of this surah that is playing to ?ayah and keeps it playing", () => {
    act(() => {
      usePlayerStore.getState().setQueue(ayahs, "surah");
      usePlayerStore.getState().play(ayahs[0]);
    });
    url.search = "ayah=3";
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    const { currentAyahId, isPlaying, activeAudioSrc } = usePlayerStore.getState();
    expect({ currentAyahId, isPlaying, activeAudioSrc }).toEqual({
      currentAyahId: "2:3",
      isPlaying: true,
      activeAudioSrc: "/audio/mishary-alafasy/002003.mp3",
    });
  });

  it("opens at the first ayah when ?ayah is not an ayah of the surah", () => {
    url.search = "ayah=9";
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(screen.getByText("Ajet 1 od 3")).toBeInTheDocument();
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 1, lastMode: "learning" });
  });

  it("moves the learning position along with Sljedeći ajet", async () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 3, lastMode: "learning" });
  });
});
