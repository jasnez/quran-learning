/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LessonPage from "../page";

const mockLesson = {
  id: 2,
  slug: "mad-duljenje",
  title: "Mad (duljenje)",
  subtitle: "Duljenje samoglasnika.",
  ruleType: "mad",
  color: "text-emerald-600",
  colorHex: "#16A34A",
  estimatedMinutes: 7,
  prerequisite: "Lekcija 1",
  sections: {
    introduction: ["Intro paragraf."],
    definition: ["Definicija."],
    whenItOccurs: ["Kada nastaje."],
    howToProduce: ["Korak 1", "Korak 2"],
    examples: [
      {
        arabic: "مَالِكِ يَوْمِ الدِّينِ",
        transliteration: "Māliki yawmi d-dīn",
        translation: "Primjer sa madom.",
        rule: "Madd tabii",
      },
    ],
    practiceAyahs: [
      { surah: 1, ayah: 4, description: "Mad u Al-Fatihi, ajet 4." },
    ],
    tip: {
      title: "Savjet",
      text: "Slušaj učača i prati produžavanje.",
    },
  },
  quiz: [
    {
      question: "Šta znači Mad u tedžvidu?",
      options: [
        "Duljenje glasa",
        "Nazalni zvuk",
        "Potpuno skrivanje glasa",
      ],
      correctIndex: 0,
      explanation: "Mad označava produženje samoglasnika.",
    },
  ],
  nextLessonId: null,
  summary: "Sažetak lekcije o madda.",
};

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/data/tajwid-lessons", () => ({
  getTajwidLessonBySlug: (slug: string) =>
    Promise.resolve(slug === "mad-duljenje" ? mockLesson : null),
  getAllTajwidLessons: () =>
    Promise.resolve([
      {
        id: 1,
        slug: "uvod-tajwid",
        title: "Intro",
        subtitle: "",
        ruleType: "normal",
        color: "",
        colorHex: "#000000",
        estimatedMinutes: 5,
        prerequisite: null,
        sections: {
          introduction: [""],
          definition: [],
          whenItOccurs: [],
          examples: [],
        },
        quiz: [],
        nextLessonId: 2,
        summary: "",
      },
      mockLesson,
    ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Tajwid lesson detail page", () => {
  it("renders lesson title and subtitle", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad-duljenje" } });
    render(Page);
    expect(
      screen.getByRole("heading", { name: /mad \(duljenje\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Duljenje samoglasnika.")
    ).toBeInTheDocument();
  });

  it("shows definition and examples", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad-duljenje" } });
    render(Page);
    expect(screen.getByText(/Definicija\./i)).toBeInTheDocument();
    expect(
      screen.getByText("مَالِكِ يَوْمِ الدِّينِ")
    ).toBeInTheDocument();
  });

  it("shows quiz questions", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad-duljenje" } });
    render(Page);
    expect(
      screen.getByText(/Šta znači Mad u tedžvidu\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Duljenje glasa")).toBeInTheDocument();
  });
});

