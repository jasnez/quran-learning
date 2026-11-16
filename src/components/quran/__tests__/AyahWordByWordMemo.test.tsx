/**
 * @vitest-environment jsdom
 *
 * P1-9 guard: the playing card re-renders on each animation frame while audio plays.
 * Its word list must re-render only when the highlighted word changes.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { Ayah } from "@/types/quran";
import type { VerseTimestamp } from "@/types/wordByWord";

const renderSpy = vi.hoisted(() => vi.fn());
vi.mock("../WordByWordRenderer", () => ({
  WordByWordRenderer: (props: { activeWordIndex: number }) => {
    renderSpy(props.activeWordIndex);
    return <p data-word-by-word />;
  },
}));

import { AyahWordByWord } from "../AyahWordByWord";

afterEach(() => {
  cleanup();
  renderSpy.mockClear();
});

const ayah: Ayah = {
  id: "1:1",
  ayahNumber: 1,
  ayahNumberGlobal: 1,
  juz: 1,
  page: 1,
  arabicText: "بِسْمِ ٱللَّهِ",
  transliteration: "",
  translationBosnian: "",
  tajwidSegments: [{ text: "بِسْمِ ٱللَّهِ", rule: "normal" }],
  audio: { reciterId: "x", url: "", durationMs: 0 },
};
const verse: VerseTimestamp = {
  verseKey: "1:1",
  timestampFrom: 0,
  timestampTo: 1500,
  segments: [
    { wordPosition: 1, startMs: 0, endMs: 600 },
    { wordPosition: 2, startMs: 600, endMs: 1400 },
  ],
};

describe("AyahWordByWord re-rendering", () => {
  it("does not re-render a non-playing ayah when only the seek callback identity changes", () => {
    const { rerender } = render(
      <AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={() => {}} />,
    );
    rerender(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={() => {}} />);
    rerender(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={-1} showColors onSeekMs={() => {}} />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("re-renders when the playing position moves to another word", () => {
    const { rerender } = render(
      <AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={100} showColors onSeekMs={() => {}} />,
    );
    rerender(<AyahWordByWord ayah={ayah} verse={verse} currentTimeMs={700} showColors onSeekMs={() => {}} />);
    expect(renderSpy.mock.calls.map((c) => c[0])).toEqual([0, 1]);
  });
});
