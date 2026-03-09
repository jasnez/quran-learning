/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { WordByWordRenderer } from "../WordByWordRenderer";
import type { Word } from "@/types/quran";

const mockWords: Word[] = [
  {
    id: 1,
    ayahId: 10,
    wordOrder: 1,
    textArabic: "بِسْمِ",
    transliteration: "Bismi",
    translationShort: "In the name of",
    startTimeMs: 0,
    endTimeMs: 500,
    tajwidRule: "normal",
  },
  {
    id: 2,
    ayahId: 10,
    wordOrder: 2,
    textArabic: "ٱللَّهِ",
    transliteration: "Allahi",
    translationShort: "of Allah",
    startTimeMs: 500,
    endTimeMs: 1200,
    tajwidRule: "normal",
  },
];

describe("WordByWordRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    document.body.innerHTML = "";
  });

  it("renders each word as a span", () => {
    render(<WordByWordRenderer words={mockWords} currentTimeMs={0} />);
    expect(screen.getByText("بِسْمِ")).toBeInTheDocument();
    expect(screen.getByText("ٱللَّهِ")).toBeInTheDocument();
  });

  it("applies highlight class to the word where startTimeMs <= currentTimeMs < endTimeMs", () => {
    const { container } = render(<WordByWordRenderer words={mockWords} currentTimeMs={250} />);
    const spans = container.querySelectorAll('[data-word-id]');
    expect(spans[0]).toHaveAttribute("data-active", "true");
    expect(spans[1]).toHaveAttribute("data-active", "false");
  });

  it("highlights second word when currentTimeMs is in range", () => {
    const { container } = render(<WordByWordRenderer words={mockWords} currentTimeMs={600} />);
    const spans = container.querySelectorAll('[data-word-id]');
    expect(spans[0]).toHaveAttribute("data-active", "false");
    expect(spans[1]).toHaveAttribute("data-active", "true");
  });

  it("no word highlighted when currentTimeMs is before first word", () => {
    const { container } = render(<WordByWordRenderer words={mockWords} currentTimeMs={-100} />);
    const spans = container.querySelectorAll('[data-word-id]');
    spans.forEach((s) => expect(s).toHaveAttribute("data-active", "false"));
  });

  it("scales word timeline to audioDurationMs so highlight stays in sync with longer clip", () => {
    const { container } = render(
      <WordByWordRenderer
        words={mockWords}
        currentTimeMs={1200}
        audioDurationMs={2400}
      />
    );
    const spans = container.querySelectorAll('[data-word-id]');
    expect(spans[0]).toHaveAttribute("data-active", "false");
    expect(spans[1]).toHaveAttribute("data-active", "true");
  });

  it("calls onSeek with word when a word is clicked", () => {
    const onSeek = vi.fn();
    const { container } = render(<WordByWordRenderer words={mockWords} currentTimeMs={0} onSeek={onSeek} />);
    const secondWordSpan = container.querySelector('[data-word-id="2"] [role="button"]');
    expect(secondWordSpan).toBeInTheDocument();
    fireEvent.click(secondWordSpan!);
    expect(onSeek).toHaveBeenCalledWith(mockWords[1]);
  });

  it("words have title for tooltip (transliteration + translation)", () => {
    const { container } = render(<WordByWordRenderer words={mockWords} currentTimeMs={0} />);
    const firstWord = container.querySelector('[data-word-id="1"] [title]');
    expect(firstWord).toHaveAttribute("title", "Bismi — In the name of");
  });

  it("when showInterlinear is true, shows translation below each word", () => {
    render(<WordByWordRenderer words={mockWords} currentTimeMs={0} showInterlinear />);
    expect(screen.getByText("In the name of")).toBeInTheDocument();
    expect(screen.getByText("of Allah")).toBeInTheDocument();
  });

  it("renders empty when words array is empty", () => {
    const { container } = render(<WordByWordRenderer words={[]} currentTimeMs={0} />);
    const wrapper = container.querySelector('[data-word-by-word]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.textContent).toBe("");
  });
});
