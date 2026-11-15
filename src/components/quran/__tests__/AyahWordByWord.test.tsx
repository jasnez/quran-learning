/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AyahWordByWord } from "../AyahWordByWord";
import type { Ayah } from "@/types/quran";
import type { VerseTimestamp } from "@/types/wordByWord";

afterEach(cleanup);

// 1:2 from the static data
const ayah: Ayah = {
  id: "1:2",
  ayahNumber: 2,
  ayahNumberGlobal: 2,
  juz: 1,
  page: 1,
  arabicText: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
  transliteration: "",
  translationBosnian: "",
  tajwidSegments: [
    { text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَ", rule: "normal" },
    { text: "ـٰ", rule: "mad" },
    { text: "لَمِينَ", rule: "normal" },
  ],
  audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
};

const verse: VerseTimestamp = {
  verseKey: "1:2",
  timestampFrom: 6090,
  timestampTo: 11680,
  segments: [
    { wordPosition: 1, startMs: 6025, endMs: 7025 },
    { wordPosition: 2, startMs: 7025, endMs: 7885 },
    { wordPosition: 3, startMs: 7885, endMs: 8515 },
    { wordPosition: 4, startMs: 8515, endMs: 11550 },
  ],
};

const NOTE = /Označavanje riječi nije dostupno za ovaj ajet/;

function activeIndexes(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-word-index][data-active=true]")).map(
    (el) => el.dataset.wordIndex,
  );
}

describe("AyahWordByWord", () => {
  it("highlights word 2 of 1:2 at 1000 ms", () => {
    const { container } = render(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={1000} showColors />);
    expect(activeIndexes(container)).toEqual(["1"]);
  });

  it("no highlight when currentTimeMs is -1", () => {
    const { container } = render(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors />);
    expect(container.querySelectorAll("[data-word-index]")).toHaveLength(4);
    expect(activeIndexes(container)).toEqual([]);
  });

  it("falls back to tajwid text with the note for an invalid verse", () => {
    const truncated: VerseTimestamp = { ...verse, segments: verse.segments.slice(0, 2) };
    const { container } = render(<AyahWordByWord ayah={ayah} verse={truncated} currentTimeMs={1000} showColors />);
    expect(container.querySelector("[data-word-by-word]")).toBeNull();
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  it("no note while verse is undefined", () => {
    const { container } = render(<AyahWordByWord ayah={ayah} verse={undefined} currentTimeMs={1000} showColors />);
    expect(container.querySelector("[data-word-by-word]")).toBeNull();
    expect(screen.queryByText(NOTE)).toBeNull();
    expect(container.textContent).toContain("لِلَّهِ");
  });

  it("click on word 3 seeks to its ayah-relative start", () => {
    const onSeekMs = vi.fn();
    const { container } = render(
      <AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={onSeekMs} />,
    );
    fireEvent.click(container.querySelector('[data-word-index="2"]')!);
    expect(onSeekMs).toHaveBeenCalledWith(1795);
  });

  it("uses the latest seek callback after a re-render with a new callback", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender, container } = render(
      <AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={first} />,
    );
    rerender(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={latest} />);
    fireEvent.click(container.querySelector('[data-word-index="1"]')!);
    expect(latest).toHaveBeenCalledWith(935);
    expect(first).not.toHaveBeenCalled();
  });
});
