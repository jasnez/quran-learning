/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { WordByWordRenderer } from "../WordByWordRenderer";
import type { TajwidSegment } from "@/types/quran";
import { tajwidRuleClasses } from "@/lib/quran/tajwidStyles";

afterEach(cleanup);

const words: TajwidSegment[][] = [
  [{ text: "بِسْمِ", rule: "normal" }],
  [{ text: "ٱللَّهِ", rule: "normal" }],
  [
    { text: "ٱلرَّحْمَ", rule: "normal" },
    { text: "ـٰ", rule: "mad" },
    { text: "نِ", rule: "normal" },
  ],
];

function wordEls(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-word-index]"));
}

describe("WordByWordRenderer", () => {
  it("marks only the active word", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={1} showColors />);
    expect(wordEls(container).map((el) => el.dataset.active)).toEqual(["false", "true", "false"]);
  });

  it("applies tajwid classes per piece when showColors", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={-1} showColors />);
    const mad = Array.from(wordEls(container)[2].querySelectorAll("span")).find((s) => s.textContent === "ـٰ");
    expect(mad?.className).toContain(tajwidRuleClasses.mad.split(" ")[0]);
  });

  it("uses normal class when showColors is false", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={-1} showColors={false} />);
    const mad = Array.from(wordEls(container)[2].querySelectorAll("span")).find((s) => s.textContent === "ـٰ");
    expect(mad?.className).not.toContain(tajwidRuleClasses.mad.split(" ")[0]);
    expect(mad?.className).toContain(tajwidRuleClasses.normal);
  });

  it("calls onWordClick with the index on click and Enter", () => {
    const onWordClick = vi.fn();
    const { container } = render(
      <WordByWordRenderer words={words} activeWordIndex={-1} showColors onWordClick={onWordClick} />,
    );
    fireEvent.click(wordEls(container)[2]);
    fireEvent.keyDown(wordEls(container)[0], { key: "Enter" });
    expect(onWordClick.mock.calls).toEqual([[2], [0]]);
  });

  it("words are not focusable buttons without onWordClick", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={-1} showColors />);
    expect(container.querySelector("[role=button]")).toBeNull();
  });

  // The highlight must not reuse a tajwid hue (qalqalah is amber), or that rule disappears on the active word.
  it("highlights the active word without a tajwid hue", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={1} showColors />);
    const active = wordEls(container)[1];
    expect(active.className).not.toMatch(/tj-/);
    expect(active.className).toMatch(/ring-/);
  });

  // One tab stop per ayah (roving tabindex); arrow keys move between words.
  it("has a single tab stop: the active word, else the first word", () => {
    const onWordClick = vi.fn();
    const { container, rerender } = render(
      <WordByWordRenderer words={words} activeWordIndex={-1} showColors onWordClick={onWordClick} />,
    );
    expect(wordEls(container).map((el) => el.tabIndex)).toEqual([0, -1, -1]);
    rerender(<WordByWordRenderer words={words} activeWordIndex={2} showColors onWordClick={onWordClick} />);
    expect(wordEls(container).map((el) => el.tabIndex)).toEqual([-1, -1, 0]);
  });

  it("moves focus with arrow keys in reading order (right-to-left)", () => {
    const onWordClick = vi.fn();
    const { container } = render(
      <WordByWordRenderer words={words} activeWordIndex={-1} showColors onWordClick={onWordClick} />,
    );
    const els = wordEls(container);
    els[0].focus();
    fireEvent.keyDown(els[0], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(els[1]);
    fireEvent.keyDown(els[1], { key: "ArrowRight" });
    expect(document.activeElement).toBe(els[0]);
    fireEvent.keyDown(els[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(els[0]);
    expect(onWordClick).not.toHaveBeenCalled();
  });

  it("renders no Latin text", () => {
    const { container } = render(<WordByWordRenderer words={words} activeWordIndex={0} showColors />);
    expect(container.textContent).not.toMatch(/[A-Za-z]/);
  });
});
