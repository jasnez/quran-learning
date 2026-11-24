/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TajwidQuiz } from "../TajwidQuiz";

const mockMarkStarted = vi.fn();
const mockRecordResult = vi.fn();

vi.mock("@/store/progressStore", async (importOriginal) => ({
  isTajwidQuizPassed: (await importOriginal<typeof import("@/store/progressStore")>()).isTajwidQuizPassed,
  tajwidQuizPassScore: (await importOriginal<typeof import("@/store/progressStore")>()).tajwidQuizPassScore,
  useProgressStore: (selector: (s: { markTajwidLessonStarted: () => void; recordTajwidQuizResult: (slug: string, score: number, total: number) => void }) => unknown) =>
    selector({
      markTajwidLessonStarted: mockMarkStarted,
      recordTajwidQuizResult: mockRecordResult,
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
  it("does not double-count last correct answer: result is 2/2 and records (slug, 2, 2)", () => {
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
    expect(mockRecordResult).toHaveBeenCalledTimes(1);
    expect(mockRecordResult).toHaveBeenCalledWith("test-lesson", 2, 2);
  });

  it("when one correct and one wrong, result is 1/2 and records (slug, 1, 2)", () => {
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
    expect(mockRecordResult).toHaveBeenCalledWith("test-lesson", 1, 2);
  });

  it("below the pass mark, says how many correct answers complete the lesson", () => {
    render(
      <TajwidQuiz
        quiz={twoQuestionQuiz}
        lessonSlug="test-lesson"
        nextLessonSlug={null}
        nextLessonTitle={null}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /B/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/i }));
    fireEvent.click(screen.getByRole("button", { name: /X/i }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/i }));

    expect(screen.getByText(/Rezultat: 0 \/ 2/)).toBeInTheDocument();
    expect(screen.getByText(/Za završetak lekcije treba najmanje 2 tačna odgovora od 2/)).toBeInTheDocument();
  });
});

describe("TajwidQuiz status messages and focus", () => {
  const renderQuiz = (quiz = twoQuestionQuiz) =>
    render(<TajwidQuiz quiz={quiz} lessonSlug="s" nextLessonSlug={null} nextLessonTitle={null} />);

  it("has an empty status region before answering", () => {
    renderQuiz();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces a correct answer", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Tačno.");
  });

  it("announces the right answer after a wrong one and keeps focus on the chosen option", () => {
    renderQuiz([
      { question: "Q?", options: ["Prva", "Druga", "Treća"], correctIndex: 1, explanation: "E." },
    ]);
    const chosen = screen.getByRole("button", { name: /Prva/ });
    chosen.focus();
    fireEvent.click(chosen);
    expect(screen.getByRole("status")).toHaveTextContent("Nije tačno. Tačan odgovor je B: Druga.");
    expect(chosen).toHaveAttribute("aria-disabled", "true");
    expect(chosen).not.toBeDisabled();
    expect(chosen).toHaveFocus();
  });

  // "Sljedeće pitanje" unmounts with the feedback; focus would fall to the body.
  it("moves focus to the next question's text, but not on mount", () => {
    renderQuiz();
    expect(document.activeElement).toBe(document.body);
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    const next = screen.getByRole("button", { name: /Sljedeće pitanje/ });
    next.focus();
    fireEvent.click(next);
    const question = screen.getByText("Second question?");
    expect(document.activeElement).toBe(question);
    expect(question).toHaveAttribute("tabindex", "-1");
  });

  it("clears the message when moving to the next question", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/ }));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("on finish keeps the region, clears it and focuses the heading", () => {
    renderQuiz();
    const status = screen.getByRole("status");
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/ }));
    fireEvent.click(screen.getByRole("button", { name: /Y/ }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/ }));
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByRole("heading", { name: "Kviz završen" })).toHaveFocus();
  });

  it("Ponovi kviz moves focus to the first question", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/ }));
    fireEvent.click(screen.getByRole("button", { name: /Y/ }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/ }));
    fireEvent.click(screen.getByRole("button", { name: "Ponovi kviz" }));
    expect(screen.getByText("First question?")).toHaveFocus();
  });

  it("does not move focus to the question on first render", () => {
    renderQuiz();
    expect(document.body).toHaveFocus();
  });

  it("hides the finished heading's ring only for keyboard focus, not for every focus", () => {
    renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/ }));
    fireEvent.click(screen.getByRole("button", { name: /Y/ }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/ }));
    const heading = screen.getByRole("heading", { name: "Kviz završen" });
    expect(heading).toHaveClass("focus-visible:outline-hidden");
    expect(heading).not.toHaveClass("focus:outline-hidden");
  });

  it("uses the new result copy, without gendered forms", () => {
    const { container } = renderQuiz();
    fireEvent.click(screen.getByRole("button", { name: /A/ }));
    fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje/ }));
    fireEvent.click(screen.getByRole("button", { name: /Y/ }));
    fireEvent.click(screen.getByRole("button", { name: /Završi kviz/ }));
    expect(screen.getByText("Sve je tačno. Lekcija je savladana. Mašallah!")).toBeInTheDocument();
    expect(container.textContent).not.toContain("/la");
  });

  it("uses the middle copy when passed but not perfect", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      question: `Q${i}?`,
      options: ["Aa", "Bb"],
      correctIndex: 0,
      explanation: "E.",
    }));
    renderQuiz(five);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: i === 4 ? /Bb/ : /Aa/ }));
      fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje|Završi kviz/ }));
    }
    expect(
      screen.getByText("Lekcija je savladana. Mašallah! Kviz možeš ponoviti kad god hoćeš."),
    ).toBeInTheDocument();
  });

  it("fail copy states the pass score with the right plural", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      question: `Q${i}?`,
      options: ["Aa", "Bb"],
      correctIndex: 0,
      explanation: "E.",
    }));
    renderQuiz(five);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Bb/ }));
      fireEvent.click(screen.getByRole("button", { name: /Sljedeće pitanje|Završi kviz/ }));
    }
    expect(
      screen.getByText(
        "Za završetak lekcije treba najmanje 3 tačna odgovora od 5. Pročitaj lekciju još jednom pa ponovi kviz.",
      ),
    ).toBeInTheDocument();
  });
});

describe("TajwidQuiz Arabic text", () => {
  it("marks Arabic letters in the question and the options as Arabic", () => {
    const qaf = String.fromCodePoint(0x0642);
    const dal = String.fromCodePoint(0x062f);
    render(
      <TajwidQuiz
        quiz={[
          { question: `Koji je harf (${qaf})?`, options: [`${qaf} ${dal}`, "qāf", "dāl"], correctIndex: 0, explanation: "Zato." },
        ]}
        lessonSlug="qalqalah-odskok"
        nextLessonSlug={null}
        nextLessonTitle={null}
      />,
    );
    const runs = Array.from(document.querySelectorAll('bdi[lang="ar"]')).map((b) => b.textContent);
    expect(runs).toEqual([qaf, `${qaf} ${dal}`]);
  });
});
