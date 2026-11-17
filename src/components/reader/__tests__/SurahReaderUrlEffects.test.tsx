/**
 * @vitest-environment jsdom
 *
 * QA P2-1: opening a surah in the reader must not throw away a saved
 * "Nastavi učenje" position in that same surah (e.g. closing learn mode at
 * 2:150 opens /surah/2 without ?ayah).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { SurahReaderUrlEffects } from "../SurahReaderUrlEffects";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import type { Ayah } from "@/types/quran";

const url = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(url.search),
}));

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

const baqarah = Array.from({ length: 150 }, (_, i) => ayah(i + 1));

function lastPosition() {
  const { lastSurahNumber, lastAyahNumber, lastMode } = useProgressStore.getState();
  return { lastSurahNumber, lastAyahNumber, lastMode };
}

describe("SurahReaderUrlEffects and the continue position", () => {
  beforeEach(() => {
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useProgressStore.setState(useProgressStore.getInitialState(), true);
    localStorage.clear();
    url.search = "";
  });

  afterEach(cleanup);

  it("keeps a saved position in the same surah when the reader opens without ?ayah", () => {
    useProgressStore.getState().updateLastPosition(2, 150, "El-Bekare", "learning");
    render(<SurahReaderUrlEffects ayahs={baqarah} surahNameLatin="El-Bekare" />);
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 150, lastMode: "learning" });
  });

  it("starts at ayah 1 when the saved position is in another surah", () => {
    useProgressStore.getState().updateLastPosition(113, 5, "El-Feleq", "reader");
    render(<SurahReaderUrlEffects ayahs={baqarah} surahNameLatin="El-Bekare" />);
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 1, lastMode: "reader" });
  });

  it("saves the ayah from ?ayah even when another ayah of the surah was saved", () => {
    useProgressStore.getState().updateLastPosition(2, 150, "El-Bekare", "learning");
    url.search = "ayah=7";
    render(<SurahReaderUrlEffects ayahs={baqarah} surahNameLatin="El-Bekare" />);
    expect(lastPosition()).toEqual({ lastSurahNumber: 2, lastAyahNumber: 7, lastMode: "reader" });
  });
});
