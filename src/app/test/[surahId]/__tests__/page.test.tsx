/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TestPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockSurah = {
  id: "1",
  surahNumber: 1,
  slug: "al-fatiha",
  nameArabic: "الفاتحة",
  nameLatin: "Al-Fatiha",
  nameBosnian: "El-Fatiha",
  revelationType: "meccan" as const,
  ayahCount: 7,
};

const mockAyahs = [
  {
    id: "1:1",
    ayahNumber: 1,
    ayahNumberGlobal: 1,
    juz: 1,
    page: 1,
    arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    transliteration: "",
    translationBosnian: "U ime Allaha, Milostivog, Samilosnog.",
    tajwidSegments: [{ text: "الرَّحِيمِ", rule: "mad" as const }],
    audio: {
      reciterId: "1",
      url: "http://example.com/1.mp3",
      durationMs: 1000,
    },
  },
];

vi.mock("@/lib/data", () => ({
  getAllSurahs: () => Promise.resolve([mockSurah]),
  getSurahByNumber: () =>
    Promise.resolve({
      surah: mockSurah,
      ayahs: mockAyahs,
    }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Test mode page", () => {
  it("renders surah name and initial question", async () => {
    const Page = await TestPage({ params: Promise.resolve({ surahId: "1" }) });
    render(Page);
    expect(
      screen.getByText(/Al-Fatiha — El-Fatiha/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Preslušaj i prepoznaj/i)
    ).toBeInTheDocument();
  });
});

