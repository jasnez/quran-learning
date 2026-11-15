/**
 * @vitest-environment jsdom
 *
 * Learn mode queues its surah as a learn queue, so reaching the end of the
 * surah stops playback instead of navigating to the next surah's reader.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
  ayahCount: 2,
};

const ayah = (n: number): Ayah =>
  ({
    id: `1:${n}`,
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

describe("LearnModeContent playback queue", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve([]) })));
    usePlayerStore.setState({ queue: [], queueSource: "surah", currentAyahId: null, isPlaying: false, activeAudioSrc: null });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("marks the surah queue as a learn queue when learn mode opens", () => {
    render(<LearnModeContent surah={surah} ayahs={[ayah(1), ayah(2)]} />);
    expect(usePlayerStore.getState().queueSource).toBe("learn");
  });

  it("keeps the learn queue when the user starts playback", async () => {
    render(<LearnModeContent surah={surah} ayahs={[ayah(1), ayah(2)]} />);
    await userEvent.click(screen.getByRole("button", { name: "Pusti audio" }));
    const state = usePlayerStore.getState();
    expect(state.isPlaying).toBe(true);
    expect(state.queueSource).toBe("learn");
  });
});
