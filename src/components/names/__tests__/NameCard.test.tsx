/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NameCard } from "../NameCard";

const name = {
  index: 1,
  arabic: "الرَّحْمَٰنُ",
  transliteration: "Er-Rahman",
  translationBosnian: "Milostivi",
  audioUrl: "https://example.test/1.mp3",
};

afterEach(cleanup);

describe("NameCard", () => {
  // QA section 6: 99 cards each fetched their MP3 on page open (~3.8 MB).
  it("does not download the audio before the reader asks for it", () => {
    const { container } = render(<NameCard name={name} />);
    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute("preload", "none");
    expect(audio).toHaveAttribute("src", name.audioUrl);
  });

  it("marks the Arabic as Arabic and names the button after the name", () => {
    render(<NameCard name={name} />);
    expect(screen.getByText(name.arabic)).toHaveAttribute("lang", "ar");
    const button = screen.getByRole("button", { name: "Pusti: Er-Rahman" });
    expect(button).toHaveTextContent("Pusti");
  });

  it("plays the audio on click", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    try {
      render(<NameCard name={name} />);
      fireEvent.click(screen.getByRole("button", { name: /^Pusti: / }));
      expect(play).toHaveBeenCalledTimes(1);
    } finally {
      play.mockRestore();
    }
  });
});
