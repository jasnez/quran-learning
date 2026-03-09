/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import LessonPage from "../page";

const mockLesson = {
  id: "mad",
  title: "Mad (duljenje)",
  titleArabic: "المد",
  description: "Duljenje samoglasnika.",
  ruleType: "mad",
  explanation: "Detaljno objašnjenje pravila Mad na bosanskom jeziku.",
  examples: [
    {
      arabicText: "مَالِكِ يَوْمِ الدِّينِ",
      transliteration: "Māliki yawmi d-dīn",
      highlightIndices: [0, 1],
      audioUrl: "https://example.com/mad-example.mp3",
    },
  ],
  practiceAyahs: [
    { surahNumber: 1, ayahNumber: 4, relevantWordIndices: [0] },
  ],
  quiz: [
    {
      question: "Šta znači Mad u tedžvidu?",
      options: [
        "Duljenje glasa",
        "Nazalni zvuk",
        "Potpuno skrivanje glasa",
      ],
      correctIndex: 0,
    },
  ],
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
  getTajwidLessonById: (id: string) =>
    Promise.resolve(id === "mad" ? mockLesson : null),
  getAllTajwidLessons: () =>
    Promise.resolve([
      { id: "intro", title: "Intro", titleArabic: "", description: "", ruleType: "normal" },
      { id: "mad", title: mockLesson.title, titleArabic: mockLesson.titleArabic, description: mockLesson.description, ruleType: "mad" },
    ]),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Tajwid lesson detail page", () => {
  it("renders lesson title and Arabic title", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad" } });
    render(Page);
    expect(
      screen.getByRole("heading", { name: /mad \(duljenje\)/i })
    ).toBeInTheDocument();
    expect(screen.getByText("المد")).toBeInTheDocument();
  });

  it("shows explanation and examples", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad" } });
    render(Page);
    expect(
      screen.getByText(/Detaljno objašnjenje pravila Mad/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("مَالِكِ يَوْمِ الدِّينِ")
    ).toBeInTheDocument();
  });

  it("shows quiz questions", async () => {
    const Page = await LessonPage({ params: { lessonId: "mad" } });
    render(Page);
    expect(
      screen.getByText(/Šta znači Mad u tedžvidu\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Duljenje glasa")).toBeInTheDocument();
  });
});

