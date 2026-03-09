/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WordByWordChapterRenderer } from "../WordByWordChapterRenderer";
import type { WordData, WordTimingSegment } from "@/types/wordByWord";

const mockWords: WordData[] = [
  {
    position: 1,
    textUthmani: "بِسْمِ",
    transliteration: "Bismi",
    translation: "In the name of",
    charTypeName: "word",
  },
  {
    position: 2,
    textUthmani: "ٱللَّهِ",
    transliteration: "Allahi",
    translation: "of Allah",
    charTypeName: "word",
  },
];

const mockSegments: WordTimingSegment[] = [
  { wordPosition: 1, startMs: 0, endMs: 630 },
  { wordPosition: 2, startMs: 650, endMs: 1570 },
];

describe("WordByWordChapterRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders each word with textUthmani", () => {
    render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={0}
        isPlaying={false}
      />
    );
    expect(screen.getByText("بِسْمِ")).toBeInTheDocument();
    expect(screen.getByText("ٱللَّهِ")).toBeInTheDocument();
  });

  it("highlights active word when currentTimeMs is within segment", () => {
    const { container } = render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={250}
        isPlaying={true}
      />
    );
    const spans = container.querySelectorAll('[data-word-position]');
    expect(spans[0]).toHaveAttribute("data-active", "true");
    expect(spans[1]).toHaveAttribute("data-active", "false");
  });

  it("highlights second word when currentTimeMs in second segment", () => {
    const { container } = render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={800}
        isPlaying={true}
      />
    );
    const spans = container.querySelectorAll('[data-word-position]');
    expect(spans[0]).toHaveAttribute("data-active", "false");
    expect(spans[1]).toHaveAttribute("data-active", "true");
  });

  it("marks past words with data-past for muted style", () => {
    const { container } = render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={800}
        isPlaying={true}
      />
    );
    const spans = container.querySelectorAll('[data-word-position]');
    expect(spans[0]).toHaveAttribute("data-past", "true");
    expect(spans[1]).toHaveAttribute("data-past", "false");
  });

  it("calls onWordClick with position and startMs when word clicked", () => {
    const onWordClick = vi.fn();
    const { container } = render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={0}
        isPlaying={false}
        onWordClick={onWordClick}
      />
    );
    const secondWord = container.querySelector('[data-word-position="2"]');
    expect(secondWord).toBeInTheDocument();
    fireEvent.click(secondWord!);
    expect(onWordClick).toHaveBeenCalledWith(2, 650);
  });

  it("shows tooltip title with transliteration and translation", () => {
    render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={mockWords}
        segments={mockSegments}
        currentTimeMs={0}
        isPlaying={false}
      />
    );
    const first = document.querySelector('[data-word-position="1"]');
    expect(first).toHaveAttribute("title", "Bismi — In the name of");
  });

  it("renders empty when no words", () => {
    const { container } = render(
      <WordByWordChapterRenderer
        verseKey="1:1"
        words={[]}
        segments={[]}
        currentTimeMs={0}
        isPlaying={false}
      />
    );
    const wrapper = container.querySelector('[data-word-by-word-chapter]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.textContent?.trim()).toBe("");
  });
});
