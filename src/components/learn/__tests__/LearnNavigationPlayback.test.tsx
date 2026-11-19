/**
 * @vitest-environment jsdom
 *
 * QA P2-2: in learn mode, moving between ayahs is navigation, not listening.
 * "Prethodni ajet" / "Sljedeći ajet" must not start audio; audio that was
 * already playing continues at the new ayah.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnModeContent } from "../LearnModeContent";
import { usePlayerStore } from "@/store/playerStore";
import type { Ayah, SurahSummary } from "@/types/quran";

vi.mock("@/lib/audio/audioManager", () => ({
  play: () => Promise.resolve(),
  pause: () => {},
  seek: () => {},
}));

const surah: SurahSummary = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatihah",
  nameBosnian: "Al-Fatiha",
  revelationType: "meccan",
  ayahCount: 3,
};

const ayah = (surahNumber: number, n: number): Ayah =>
  ({
    id: `${surahNumber}:${n}`,
    ayahNumber: n,
    ayahNumberGlobal: n,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [{ text: "بِسْمِ", rule: "normal" }],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }) as Ayah;

const ayahs = [ayah(1, 1), ayah(1, 2), ayah(1, 3)];

function player() {
  const { currentAyahId, isPlaying, activeAudioSrc } = usePlayerStore.getState();
  return { currentAyahId, isPlaying, activeAudioSrc };
}

describe("LearnModeContent ayah navigation and playback", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })));
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("Sljedeći ajet with audio stopped shows the next ayah and plays nothing", async () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    expect(screen.getByText("Ajet 2 od 3")).toBeInTheDocument();
    expect(player()).toEqual({ currentAyahId: "1:2", isPlaying: false, activeAudioSrc: null });
  });

  it("Prethodni ajet with audio stopped shows the previous ayah and plays nothing", async () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Prethodni ajet" }));
    expect(screen.getByText("Ajet 2 od 3")).toBeInTheDocument();
    expect(player()).toEqual({ currentAyahId: "1:2", isPlaying: false, activeAudioSrc: null });
  });

  it("Sljedeći ajet while audio plays continues playback at the next ayah", async () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await userEvent.click(screen.getByRole("button", { name: "Pusti ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    expect(player()).toEqual({
      currentAyahId: "1:2",
      isPlaying: true,
      activeAudioSrc: "/audio/mishary-alafasy/001002.mp3",
    });
    expect(usePlayerStore.getState().queueSource).toBe("learn");
  });

  it("Prethodni ajet while paused moves there and stays paused", async () => {
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    await userEvent.click(screen.getByRole("button", { name: "Sljedeći ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Pusti ajet" }));
    await userEvent.click(screen.getByRole("button", { name: "Pauziraj" }));
    await userEvent.click(screen.getByRole("button", { name: "Prethodni ajet" }));
    expect(player()).toEqual({
      currentAyahId: "1:1",
      isPlaying: false,
      activeAudioSrc: "/audio/mishary-alafasy/001001.mp3",
    });
  });
});

describe("LearnModeContent entry while audio is loaded", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })));
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps audio of the same surah playing and opens at the playing ayah", () => {
    act(() => {
      usePlayerStore.getState().setQueue(ayahs, "surah");
      usePlayerStore.getState().play(ayahs[1]);
    });
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(screen.getByText("Ajet 2 od 3")).toBeInTheDocument();
    expect(player()).toEqual({
      currentAyahId: "1:2",
      isPlaying: true,
      activeAudioSrc: "/audio/mishary-alafasy/001002.mp3",
    });
  });

  it("stops audio of another surah and opens at the first ayah", () => {
    const other = [ayah(3, 4), ayah(3, 5)];
    act(() => {
      usePlayerStore.getState().setQueue(other, "surah");
      usePlayerStore.getState().play(other[1]);
    });
    render(<LearnModeContent surah={surah} ayahs={ayahs} />);
    expect(screen.getByText("Ajet 1 od 3")).toBeInTheDocument();
    expect(player()).toEqual({ currentAyahId: "1:1", isPlaying: false, activeAudioSrc: null });
  });
});
