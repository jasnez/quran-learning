/**
 * @vitest-environment jsdom
 *
 * AyahText: the Arabic, the transcription and the translation of one ayah, in that order and
 * with the same type roles on every screen (reader, juz, duas, saved ayahs, search, learning).
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AyahText } from "../AyahText";

afterEach(cleanup);

const arabic = <p data-testid="arabic" lang="ar" dir="rtl" />;

describe("AyahText", () => {
  it("puts the Arabic first, then the transcription, then the translation", () => {
    const { container } = render(
      <AyahText arabic={arabic} transliteration="Qul huwallāhu eḥad" translation="Reci: On je Allah, Jedan!" />,
    );
    const order = [...container.firstElementChild!.children].map(
      (el) => el.getAttribute("data-testid") ?? el.getAttribute("data-ayah-part"),
    );
    expect(order).toEqual(["arabic", "transliteration", "translation"]);
  });

  it("sets the transcription upright in the reading face, muted, 18 px and 19 px from md", () => {
    render(<AyahText arabic={arabic} transliteration="Qul huwallāhu eḥad" />);
    const line = screen.getByText("Qul huwallāhu eḥad");
    expect(line).toHaveClass("font-transliteration", "text-ink-muted", "text-[1.125rem]", "md:text-[1.1875rem]", "mt-3");
    expect(line.className).not.toMatch(/italic/);
  });

  it("sets the translation in the reading face, left aligned, at most 42rem wide", () => {
    render(<AyahText arabic={arabic} translation="Allah je Utočište svakom!" />);
    const line = screen.getByText("Allah je Utočište svakom!");
    expect(line).toHaveClass("font-read", "text-ink", "text-[1.0625rem]", "md:text-lg", "mt-2", "max-w-[42rem]", "text-left");
  });

  it("centers the Latin lines only in the learning layout", () => {
    render(<AyahText arabic={arabic} transliteration="Allāhuṣ-ṣamed" translation="Allah je Utočište svakom!" align="center" />);
    expect(screen.getByText("Allāhuṣ-ṣamed")).toHaveClass("text-center");
    expect(screen.getByText("Allah je Utočište svakom!")).toHaveClass("text-center", "mx-auto");
  });

  it("renders no line for a missing or empty transcription or translation", () => {
    const { container } = render(<AyahText arabic={arabic} transliteration="" translation={null} />);
    expect(container.querySelector('[data-ayah-part="transliteration"]')).toBeNull();
    expect(container.querySelector('[data-ayah-part="translation"]')).toBeNull();
  });
});
