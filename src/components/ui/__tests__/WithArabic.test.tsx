/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { splitArabicRuns, WithArabic } from "../WithArabic";

// Built from code points so the test does not depend on typed Arabic.
const QAF = String.fromCodePoint(0x0642);
const TA = String.fromCodePoint(0x0637);
const BA = String.fromCodePoint(0x0628);
const FATHA = String.fromCodePoint(0x064e);

describe("splitArabicRuns", () => {
  it("splits Latin text and runs of Arabic script; spaces between Arabic letters stay in the run", () => {
    expect(splitArabicRuns(`Harfovi su: ${QAF} ${TA} ${BA}.`)).toEqual([
      { text: "Harfovi su: ", ar: false },
      { text: `${QAF} ${TA} ${BA}`, ar: true },
      { text: ".", ar: false },
    ]);
  });

  it("keeps harakat with their letters and handles text without Arabic", () => {
    expect(splitArabicRuns(`qāf (${QAF}${FATHA})`)).toEqual([
      { text: "qāf (", ar: false },
      { text: `${QAF}${FATHA}`, ar: true },
      { text: ")", ar: false },
    ]);
    expect(splitArabicRuns("samo latinica")).toEqual([{ text: "samo latinica", ar: false }]);
  });
});

describe("WithArabic", () => {
  it("wraps each Arabic run in an isolated span marked as Arabic, leaves the rest as text", () => {
    const { container } = render(
      <p>
        <WithArabic text={`Pamte se po izrazu: ${QAF}${TA}${BA}.`} />
      </p>,
    );
    const runs = container.querySelectorAll("bdi");
    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveAttribute("lang", "ar");
    expect(runs[0]).toHaveClass("font-arabic");
    // A letter list ("q t b j d") must not break across lines: a wrapped RTL run reads out of order.
    expect(runs[0]).toHaveClass("whitespace-nowrap");
    expect(runs[0].textContent).toBe(`${QAF}${TA}${BA}`);
    expect(container.textContent).toBe(`Pamte se po izrazu: ${QAF}${TA}${BA}.`);
  });
});
