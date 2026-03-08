/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AyahCard } from "../AyahCard";
import { SurahReaderContent } from "../SurahReaderContent";
import type { Ayah } from "@/types/quran";

const mockAyah: Ayah = {
  id: "1:1",
  ayahNumber: 1,
  ayahNumberGlobal: 1,
  juz: 1,
  page: 1,
  arabicText: "بِسْمِ ٱللَّهِ",
  transliteration: "Bismi Allahi",
  translationBosnian: "U ime Allaha",
  tajwidSegments: [{ text: "بِسْمِ ٱللَّهِ", rule: "normal" }],
  audio: { reciterId: "mishary-alafasy", url: "/audio/001.mp3", durationMs: 0 },
} as Ayah;

const mockAyahs: Ayah[] = [mockAyah];

vi.mock("@/store/playerStore", () => ({
  usePlayerStore: vi.fn((selector: (s: { currentAyahId: null; isPlaying: false; setQueue: () => void; play: () => void; pause: () => void }) => unknown) =>
    selector({
      currentAyahId: null,
      isPlaying: false,
      setQueue: () => {},
      play: () => {},
      pause: () => {},
    })
  ),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: { arabicFontSize: number; showTransliteration: boolean; showTranslation: boolean; showTajwidColors: boolean }) => unknown) =>
    selector({
      arabicFontSize: 28,
      showTransliteration: true,
      showTranslation: true,
      showTajwidColors: true,
    })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("AyahCard typography and spacing", () => {
  it("Arabic block uses font-arabic class", () => {
    const { container } = render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const arabicWrapper = container.querySelector("[dir='rtl'][lang='ar']");
    expect(arabicWrapper).toBeInTheDocument();
    expect(arabicWrapper?.className).toMatch(/font-arabic/);
  });

  it("transliteration has medium, muted styling", () => {
    render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const transliteration = screen.getByText("Bismi Allahi");
    expect(transliteration).toBeInTheDocument();
    expect(transliteration.className).toMatch(/text-stone-500|text-stone-400/);
    expect(transliteration.className).toMatch(/text-base|text-lg/);
  });

  it("translation has standard readable styling", () => {
    render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const translation = screen.getByText("U ime Allaha");
    expect(translation).toBeInTheDocument();
    expect(translation.className).toMatch(/text-stone-700|text-stone-300/);
  });

  it("transliteration has generous spacing above (whitespace separator)", () => {
    render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const transliteration = screen.getByText("Bismi Allahi");
    expect(transliteration.className).toMatch(/mt-\[1\.5rem\]|mt-6|mt-7|mt-8|mt-10/);
  });

  it("translation has clear spacing above", () => {
    render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const translation = screen.getByText("U ime Allaha");
    expect(translation.className).toMatch(/mt-4|mt-5|mt-6|mt-7/);
  });

  it("UI controls (ayah number, buttons) are smallest and subdued", () => {
    const { container } = render(
      <AyahCard
        ayah={mockAyah}
        surahAyahs={mockAyahs}
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const metaRow = container.querySelector("article > div:first-child");
    expect(metaRow).toBeInTheDocument();
    const ayahNumberBadge = metaRow?.querySelector("span");
    expect(ayahNumberBadge?.className).toMatch(/text-sm|text-xs/);
  });
});

describe("SurahReaderContent card spacing", () => {
  it("ayah list has generous gap between cards", () => {
    const { container } = render(<SurahReaderContent ayahs={mockAyahs} />);
    const list = container.querySelector("ul");
    expect(list).toBeInTheDocument();
    expect(list?.className).toMatch(/space-y-1[0-6]/);
  });
});
