/**
 * @vitest-environment jsdom
 *
 * SurahFrame: the title frame of a surah (unvan). Both names in the h1, one meta line, two
 * actions under the frame, progress as text. No navigation to other surahs and no progress bar.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import surahsData from "@/data/surahs.json";
import type { Ayah, SurahSummary } from "@/types/quran";
import { useProgressStore } from "@/store/progressStore";
import { SurahFrame } from "../SurahFrame";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} data-prefetch={prefetch === undefined ? "default" : String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

const surahs = surahsData as SurahSummary[];
const ihlas = surahs.find((s) => s.surahNumber === 112)!;
const insan = surahs.find((s) => s.surahNumber === 76)!;
const beqare = surahs.find((s) => s.surahNumber === 2)!;

/** Ayahs with only what the frame reads: the count and the mushaf pages. */
function ayahsOn(surahNumber: number, pages: number[]): Ayah[] {
  return pages.map((page, i) => ({
    id: `${surahNumber}:${i + 1}`,
    ayahNumber: i + 1,
    ayahNumberGlobal: i + 1,
    juz: 1,
    page,
    arabicText: "",
    transliteration: "",
    translationBosnian: "",
    tajwidSegments: [],
    audio: { reciterId: "mishary-alafasy", url: "", durationMs: 0 },
  }));
}

function setProgress(surahNumber: number, listened: number[], read: number[]) {
  useProgressStore.setState({
    surahProgressMap: {
      [surahNumber]: {
        surahNumber,
        totalAyahs: 0,
        ayahsListened: new Set(listened),
        ayahsRead: new Set(read),
        completionPercent: 0,
        lastAccessedAt: new Date().toISOString(),
        timeSpentMs: 0,
      },
    },
  });
}

afterEach(() => {
  cleanup();
  useProgressStore.setState(useProgressStore.getInitialState(), true);
});

describe("SurahFrame, page variant", () => {
  it("has one h1 with the Arabic name (marked as Arabic) and the Latin names", () => {
    render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604, 604, 604, 604])} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const arabic = h1.querySelector('[lang="ar"]');
    expect(arabic).toHaveTextContent(ihlas.nameArabic);
    expect(arabic).toHaveAttribute("dir", "rtl");
    expect(h1).toHaveTextContent(ihlas.nameLatin);
    expect(h1).toHaveTextContent(ihlas.nameBosnian!);
  });

  it("says the ayah count, where the surah was revealed and its mushaf page in one line", () => {
    render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604, 604, 604, 604])} />);
    expect(screen.getByText("4 ajeta, mekanska sura, str. 604")).toBeInTheDocument();
  });

  it("uses the right plural form and names a Medinan surah", () => {
    expect(insan.ayahCount).toBe(31);
    render(<SurahFrame surah={insan} />);
    expect(screen.getByText("31 ajet, medinska sura")).toBeInTheDocument();
  });

  it("gives a page range for a surah on several pages", () => {
    render(<SurahFrame surah={beqare} ayahs={ayahsOn(2, [2, 3, 49])} />);
    expect(screen.getByText("286 ajeta, medinska sura, str. 2–49")).toBeInTheDocument();
  });

  it("draws the frame as a gold border with a gold outline, and has no card look", () => {
    const { container } = render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604])} />);
    const frame = container.querySelector("[data-surah-frame]");
    expect(frame).toHaveClass("border", "border-gold", "outline-1", "outline-gold", "outline-offset-[3px]", "rounded-control");
    expect(frame!.className).not.toMatch(/rounded-2xl|bg-paper/);
  });

  it("offers to play the surah and to learn it ayah by ayah, and nothing that leaves for another surah", () => {
    render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604, 604, 604, 604])} />);
    expect(screen.getByRole("button", { name: "Pusti suru" })).toHaveClass("bg-accent");
    const learn = screen.getByRole("link", { name: "Uči ajet po ajet" });
    expect(learn).toHaveAttribute("href", "/learn/112");
    // No prefetch: it would download a second copy of the surah on every visit (QA section 6).
    expect(learn).toHaveAttribute("data-prefetch", "false");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("shows read and heard ayahs together as one line of text, without a bar", () => {
    setProgress(112, [1], [2]);
    const { container } = render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604, 604, 604, 604])} />);
    expect(screen.getByText("Pročitano: 2 od 4 ajeta")).toBeInTheDocument();
    expect(container.querySelector("[style*='width']")).toBeNull();
  });

  it("shows no progress line before anything was read or heard", () => {
    render(<SurahFrame surah={ihlas} ayahs={ayahsOn(112, [604, 604, 604, 604])} />);
    expect(screen.queryByText(/Pročitano/)).toBeNull();
  });
});

describe("SurahFrame, segment variant (a surah inside a juz)", () => {
  it("is an h2 with both names and no actions", () => {
    render(<SurahFrame surah={ihlas} variant="segment" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.querySelector('[lang="ar"]')).toHaveTextContent(ihlas.nameArabic);
    expect(h2).toHaveTextContent(ihlas.nameLatin);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
