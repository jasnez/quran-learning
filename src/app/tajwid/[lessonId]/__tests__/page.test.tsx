/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import LessonPage, { generateMetadata } from "../page";
import type { TajwidLesson } from "@/data/tajwid-lessons";

// Al-Fatiha 1 from the data: the example below takes its third word and "raḥmāni" from it.
const fatiha1 = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/ayahs/001-al-fatiha.json"), "utf-8")).ayahs[0];

const mockLesson: TajwidLesson = {
  id: 2,
  slug: "mad-duljenje",
  title: "Medd: dužina vokala",
  subtitle: "Kada se glas uči duže i koliko.",
  ruleType: "mad",
  estimatedMinutes: 7,
  prerequisite: "Lekcija 1",
  sections: [
    { heading: "Uvod", blocks: [{ kind: "p", text: `Intro paragraf (${String.fromCodePoint(0x0645, 0x062f)}).` }] },
    {
      heading: "Kada nastaje",
      blocks: [
        { kind: "p", lead: "Iklab.", text: "Nūn se uči kao mīm." },
        { kind: "list", ordered: true, items: [{ lead: "Prvo.", text: "Korak jedan." }, "Korak dva."] },
        { kind: "table", columns: ["Pojam", "Arapski"], arabicColumn: 1, rows: [["Sukun", "سُكُون"]] },
      ],
    },
    {
      heading: "Primjeri",
      blocks: [
        {
          kind: "examples",
          examples: [
            { surah: 1, ayah: 1, words: [2, 2], translitWords: [0, 0], translitChars: [12, 19], note: "Mali elif je obojen." },
          ],
        },
      ],
    },
    { heading: "Savjet", tip: true, blocks: [{ kind: "p", text: "Slušaj učača." }] },
  ],
  quiz: [
    {
      question: "Koliko traje osnovna dužina?",
      options: ["Jedan", "Dva", "Četiri", "Šest"],
      correctIndex: 1,
      explanation: "Dva kratka vokala.",
    },
  ],
  nextLessonId: null,
  summary: "Sažetak lekcije.",
};

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/data/tajwid-lessons", () => ({
  getTajwidLessonBySlug: (slug: string) => Promise.resolve(slug === "mad-duljenje" ? mockLesson : null),
  getAllTajwidLessons: () =>
    Promise.resolve([{ ...mockLesson, id: 1, slug: "uvod-tajwid", title: "Uvod u tedžvid", ruleType: "normal" }, mockLesson]),
}));

async function renderLesson() {
  return render(await LessonPage({ params: Promise.resolve({ lessonId: "mad-duljenje" }) }));
}

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Tajwid lesson detail page", () => {
  it("renders the title, the subtitle and every section heading from the data", async () => {
    await renderLesson();
    expect(screen.getByRole("heading", { level: 1, name: "Medd: dužina vokala" })).toBeInTheDocument();
    expect(screen.getByText("Kada se glas uči duže i koliko.")).toBeInTheDocument();
    for (const h of ["Uvod", "Kada nastaje", "Primjeri", "Savjet", "Sažetak"]) {
      expect(screen.getByRole("heading", { level: 2, name: h })).toBeInTheDocument();
    }
  });

  it("renders paragraphs with a bold lead, ordered lists and tables with an Arabic column", async () => {
    const { container } = await renderLesson();
    expect(screen.getByText("Iklab.").tagName).toBe("STRONG");
    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    expect(within(ol as HTMLElement).getByText("Prvo.").tagName).toBe("STRONG");
    const cell = screen.getByText("سُكُون");
    expect(cell).toHaveAttribute("lang", "ar");
    expect(cell).toHaveAttribute("dir", "rtl");
  });

  it("shows an example with the Arabic and the transcription taken from the ayah data, colored, with a reader link", async () => {
    const { container } = await renderLesson();
    const word = fatiha1.arabicText.split(" ")[2];
    const arabic = container.querySelector('[data-lesson-example] p[lang="ar"]');
    expect(arabic?.textContent).toBe(word);
    expect(arabic?.querySelector('[data-tj-rule="mad"]')).not.toBeNull();
    expect(screen.getByText(fatiha1.transliteration.slice(12, 19))).toBeInTheDocument();
    expect(screen.getByText("Mali elif je obojen.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sura 1, ajet 1" })).toHaveAttribute("href", "/surah/1?ayah=1");
  });

  it("marks Arabic inside Bosnian paragraphs as Arabic, not the Latin text around it", async () => {
    const { container } = await renderLesson();
    const intro = screen.getByRole("heading", { name: "Uvod" }).closest("section") as HTMLElement;
    const run = intro.querySelector('bdi[lang="ar"]');
    expect(run?.textContent).toBe(String.fromCodePoint(0x0645, 0x062f));
    expect(container.querySelector('td:not([lang]) bdi')).toBeNull();
  });

  it("shows a tip section as a highlighted box", async () => {
    await renderLesson();
    const tip = screen.getByRole("heading", { name: "Savjet" }).closest("section");
    expect(tip).toHaveClass("bg-accent-wash");
  });

  it("shows the quiz and the summary", async () => {
    await renderLesson();
    expect(screen.getByText("Koliko traje osnovna dužina?")).toBeInTheDocument();
    expect(screen.getByText("Sažetak lekcije.")).toBeInTheDocument();
  });
});

describe("Tajwid lesson pager", () => {
  it("links the previous lesson without arrow characters", async () => {
    const { container } = await renderLesson();
    expect(screen.getByRole("link", { name: "Prethodna: Uvod u tedžvid" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[←→↗]/);
  });

  it("keeps the back-to-top button's column free below md", async () => {
    await renderLesson();
    expect(screen.getByRole("contentinfo")).toHaveClass("max-md:pr-16");
  });
});

describe("Tajwid lesson page metadata", () => {
  it("uses the lesson title", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lessonId: "mad-duljenje" }) });
    expect(metadata.title).toBe("Medd: dužina vokala | Tedžvid lekcije");
  });

  it("falls back to the lessons title for an unknown lesson", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lessonId: "nepostojeca" }) });
    expect(metadata.title).toBe("Tedžvid lekcije");
  });
});
