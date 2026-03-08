/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SurahReaderContent } from "../SurahReaderContent";
import { ReaderSkeleton } from "../ReaderSkeleton";

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ arabicFontSize: 28, showTransliteration: true, showTranslation: true, showTajwidColors: true })
  ),
}));
vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({ currentAyahId: null, isPlaying: false })
  ),
}));
beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("SurahReaderContent empty state", () => {
  it("when ayahs is empty shows message about data coming soon", () => {
    render(<SurahReaderContent ayahs={[]} />);
    expect(
      screen.getByText(/podaci za ovu suru.*uskoro.*dostupni|dostupni.*uskoro/i)
    ).toBeInTheDocument();
  });

  it("empty state includes a calm icon", () => {
    const { container } = render(<SurahReaderContent ayahs={[]} />);
    const icon = container.querySelector("[data-empty-icon], [aria-hidden='true'] svg");
    expect(icon || container.querySelector(".text-stone-400, .text-stone-500")).toBeTruthy();
  });
});

describe("ReaderSkeleton", () => {
  it("renders skeleton ayah placeholders with animate-pulse", () => {
    const { container } = render(<ReaderSkeleton count={2} />);
    const skeletons = container.querySelectorAll("[data-skeleton-ayah]");
    expect(skeletons.length).toBe(2);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
