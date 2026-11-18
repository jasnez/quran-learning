/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TajwidLessonCard } from "../TajwidLessonCard";
import type { TajwidLesson } from "@/data/tajwid-lessons";
import type { TajwidLessonProgress } from "@/store/progressStore";

let progress: TajwidLessonProgress | undefined;

vi.mock("@/store/progressStore", () => ({
  useProgressStore: (sel: (s: { tajwidLessonProgress: Record<string, TajwidLessonProgress | undefined> }) => unknown) =>
    sel({ tajwidLessonProgress: { "lesson-2-mad": progress } }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const lesson = { slug: "lesson-2-mad", title: "Medd", subtitle: "Produživanje", ruleType: "mad" } as TajwidLesson;

describe("TajwidLessonCard", () => {
  // QA P2-8: below the pass mark a lesson stays in progress; its best result is still shown.
  it("shows the best result of a lesson still in progress", () => {
    progress = { status: "in_progress", quizScore: 2, quizTotal: 5 };
    render(<TajwidLessonCard lesson={lesson} index={1} />);
    expect(screen.getByText("U toku")).toBeInTheDocument();
    expect(screen.getByText("(2/5)")).toBeInTheDocument();
  });

  it("shows the result of a completed lesson", () => {
    progress = { status: "completed", quizScore: 4, quizTotal: 5, completedAt: "2026-11-10T10:00:00.000Z" };
    render(<TajwidLessonCard lesson={lesson} index={1} />);
    expect(screen.getByText("Završeno")).toBeInTheDocument();
    expect(screen.getByText("(4/5)")).toBeInTheDocument();
  });
});
