/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AyahUnit } from "../AyahUnit";
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

describe("AyahUnit typography and spacing", () => {
  it("Arabic block uses font-arabic class", () => {
    const { container } = render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
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

  // Tezhib type roles: the transcription is upright, 18 px (19 px from md), in the reading face
  // (Elif Book), muted.
  it("transliteration is upright, 18 px, muted, in the reading face", () => {
    render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const transliteration = screen.getByText("Bismi Allahi");
    expect(transliteration).toBeInTheDocument();
    expect(transliteration.className).toMatch(/text-ink-muted/);
    expect(transliteration.className).toMatch(/font-transliteration/);
    expect(transliteration.className).toMatch(/text-\[1\.125rem\]/);
    expect(transliteration.className).not.toMatch(/italic/);
  });

  it("translation has standard readable styling (primary)", () => {
    render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const translation = screen.getByText("U ime Allaha");
    expect(translation).toBeInTheDocument();
    expect(translation.className).toMatch(/text-ink/);
  });

  it("transliteration sits 12 px under the Arabic", () => {
    render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const transliteration = screen.getByText("Bismi Allahi");
    expect(transliteration).toHaveClass("mt-3");
  });

  it("translation sits 8 px under the transcription", () => {
    render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const translation = screen.getByText("U ime Allaha");
    expect(translation).toHaveClass("mt-2");
  });

  it("UI controls (buttons, page) come after the text and are subdued", () => {
    const { container } = render(
      <AyahUnit
        ayah={mockAyah}
        queueAyahs={mockAyahs}
        surahNameLatin="Al-Fatihah"
        arabicFontSize={28}
        showTransliteration={true}
        showTranslation={true}
        showTajwidColors={true}
      />
    );
    const actions = container.querySelector("article > div:last-child");
    expect(actions).toBeInTheDocument();
    const buttons = actions!.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button.className).toMatch(/text-ink-muted/);
  });
});

describe("SurahReaderContent card spacing", () => {
  it("the ayah list adds no gap of its own: each unit has its own space and dividing line", () => {
    const { container } = render(<SurahReaderContent ayahs={mockAyahs} surahNameLatin="Al-Fatihah" />);
    const lists = container.querySelectorAll("ul");
    const ayahList = Array.from(lists).find((ul) => ul.querySelector("article"));
    expect(ayahList).toBeInTheDocument();
    // Reduced from space-y-14 to space-y-6 in mobile redesign (less scroll fatigue)
    expect(ayahList?.className).not.toMatch(/space-y-|gap-/);
    expect(ayahList?.querySelector("article")).toHaveClass("py-5", "border-t");
  });
});
