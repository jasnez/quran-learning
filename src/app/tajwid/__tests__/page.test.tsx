/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TajwidLessonsPage from "../page";

const mockLessons = [
  {
    id: 1,
    slug: "uvod-tajwid",
    title: "Uvod u tajwid",
    subtitle: "Osnove pravila učenja Kur’ana.",
    ruleType: "normal",
    color: "",
    colorHex: "#000000",
    estimatedMinutes: 5,
    prerequisite: null,
    sections: {
      introduction: ["Intro"],
      definition: [],
      whenItOccurs: [],
      examples: [],
    },
    quiz: [],
    nextLessonId: 2,
    summary: "",
  },
  {
    id: 2,
    slug: "mad-duljenje",
    title: "Mad (duljenje)",
    subtitle: "Duljenje samoglasnika.",
    ruleType: "mad",
    color: "",
    colorHex: "#000000",
    estimatedMinutes: 5,
    prerequisite: "Lekcija 1",
    sections: {
      introduction: ["Intro 2"],
      definition: [],
      whenItOccurs: [],
      examples: [],
    },
    quiz: [],
    nextLessonId: null,
    summary: "",
  },
];

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
  getAllTajwidLessons: () => Promise.resolve(mockLessons),
}));

beforeEach(() => {
  vi.clearAllMocks();
  cleanup();
  document.body.innerHTML = "";
});

describe("Tajwid lessons listing page", () => {
  it("shows page heading 'Tedžvid lekcije'", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    expect(
      screen.getByRole("heading", { name: /tedžvid lekcije/i })
    ).toBeInTheDocument();
  });

  it("renders a card for each lesson", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    const lessonLinks = screen.getAllByRole("link").filter((el) => {
      const href = (el as HTMLAnchorElement).getAttribute("href") ?? "";
      return href.startsWith("/tajwid/") && href !== "/tajwid";
    });
    expect(lessonLinks.length).toBeGreaterThanOrEqual(mockLessons.length);
    expect(screen.getByText("Uvod u tajwid")).toBeInTheDocument();
    expect(screen.getByText("Mad (duljenje)")).toBeInTheDocument();
  });

  it("each lesson links to its detail page", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    const link = screen.getByRole("link", { name: /uvod u tajwid/i });
    expect(link).toHaveAttribute("href", "/tajwid/uvod-tajwid");
  });
});

