/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TajwidLessonsPage from "../page";

const mockLessons = [
  {
    id: "intro",
    title: "Uvod u tajwid",
    titleArabic: "مقدمة في التجويد",
    description: "Osnove pravila učenja Kur’ana.",
    ruleType: "normal",
  },
  {
    id: "mad",
    title: "Mad (duljenje)",
    titleArabic: "المد",
    description: "Duljenje samoglasnika.",
    ruleType: "mad",
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
  it("shows page heading 'Tajwid lekcije'", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    expect(
      screen.getByRole("heading", { name: /tajwid lekcije/i })
    ).toBeInTheDocument();
  });

  it("renders a card for each lesson", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThanOrEqual(mockLessons.length);
    expect(screen.getByText("Uvod u tajwid")).toBeInTheDocument();
    expect(screen.getByText("Mad (duljenje)")).toBeInTheDocument();
  });

  it("each lesson links to its detail page", async () => {
    const Page = await TajwidLessonsPage();
    render(Page);
    const link = screen.getByRole("link", { name: /uvod u tajwid/i });
    expect(link).toHaveAttribute("href", "/tajwid/intro");
  });
});

