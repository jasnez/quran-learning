/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TajwidQuiz } from "../TajwidQuiz";

const mockMarkStarted = vi.fn();
const mockMarkCompleted = vi.fn();

vi.mock("@/store/progressStore", () => ({
  useProgressStore: (selector: (s: { markTajwidLessonStarted: () => void; markTajwidLessonCompleted: (slug: string, score: number, total: number) => void }) => unknown) =>
    selector({
      markTajwidLessonStarted: mockMarkStarted,
      markTajwidLessonCompleted: mockMarkCompleted,
    }),
}));

const twoQuestionQuiz = [
  {
    question: "First question?",
    options: ["A", "B", "C"],
    correctIndex: 0,
    explanation: "First explanation.",
  },
  {
    question: "Second question?",
    options: ["X", "Y", "Z"],
    correctIndex: 1,
    explanation: "Second explanation.",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("TajwidQuiz score", () => {
  it("does not double-count last correct answer: result is 2/2 and markCompleted(slug, 2, 2)", () => {
    render(
      <TajwidQuiz
        quiz={twoQuestionQuiz}
        lessonSlug="test-lesson"
        nextLessonSlug={null}
        nextLessonTitle={null}
      />
    );

    // Answer first question correctly (index 0)
    fireEvent.click(screen.getByRole("button", { name: /A/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje|Završi kviz/i }));

    // Answer second question correctly (index 1)
    fireEvent.click(screen.getByRole("button", { name: /Y/i }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/i }));

    // Finished screen: must show 2 / 2, not 3 / 2
    expect(screen.getByText(/Rezultat: 2 \/ 2/)).toBeInTheDocument();
    expect(mockMarkCompleted).toHaveBeenCalledTimes(1);
    expect(mockMarkCompleted).toHaveBeenCalledWith("test-lesson", 2, 2);
  });

  it("when one correct and one wrong, result is 1/2 and markCompleted(slug, 1, 2)", () => {
    render(
      <TajwidQuiz
        quiz={twoQuestionQuiz}
        lessonSlug="test-lesson"
        nextLessonSlug={null}
        nextLessonTitle={null}
      />
    );

    // First: correct (A)
    fireEvent.click(screen.getByRole("button", { name: /A/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/i }));

    // Second: wrong (X instead of Y)
    fireEvent.click(screen.getByRole("button", { name: /X/i }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/i }));

    expect(screen.getByText(/Rezultat: 1 \/ 2/)).toBeInTheDocument();
    expect(mockMarkCompleted).toHaveBeenCalledWith("test-lesson", 1, 2);
  });
});
