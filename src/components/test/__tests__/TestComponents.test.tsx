/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TestOption } from "../TestOption";
import { TestProgress } from "../TestProgress";
import { TestResult } from "../TestResult";
import { TestQuestion } from "../TestQuestion";
import type { ListenIdentifyQuestion } from "@/types/testMode";

beforeEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("TestOption", () => {
  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <TestOption
        index={0}
        label="Opcija A"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByTestId("test-option-0"));
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});

describe("TestProgress", () => {
  it("shows current question and total", () => {
    render(<TestProgress current={3} total={10} />);
    expect(screen.getByText(/Pitanje 3 od 10/i)).toBeInTheDocument();
    const bar = screen.getByTestId("test-progress-bar");
    expect(bar).toBeInTheDocument();
  });
});

describe("TestResult", () => {
  it("shows score and calls callbacks", () => {
    const onRetry = vi.fn();
    const onNextType = vi.fn();
    render(
      <TestResult
        score={7}
        total={10}
        surahName="Al-Fatiha"
        testType="listen_identify"
        nextTestType="complete_ayah"
        onRetry={onRetry}
        onNextType={onNextType}
      />
    );
    expect(screen.getByText(/7 \/ 10/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ponovi ovaj test/i));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(/Sljedeći tip testa/i));
    expect(onNextType).toHaveBeenCalledTimes(1);
  });
});

describe("TestQuestion", () => {
  it("renders listen & identify question with audio and options", () => {
    const question: ListenIdentifyQuestion = {
      id: "q1",
      type: "listen_identify",
      surahNumber: 1,
      surahNameLatin: "Al-Fatiha",
      ayahNumber: 1,
      audioUrl: "http://example.com/audio.mp3",
      options: ["Ajet 1", "Ajet 2", "Ajet 3", "Ajet 4"],
      correctIndex: 1,
      explanation: "Tačan je Ajet 2.",
    };
    const onSelect = vi.fn();
    const onNext = vi.fn();

    render(
      <TestQuestion
        question={question}
        index={0}
        total={10}
        selectedIndex={null}
        showFeedback={false}
        onSelect={onSelect}
        onNext={onNext}
      />
    );

    expect(screen.getByTestId("listen-audio")).toHaveAttribute(
      "src",
      "http://example.com/audio.mp3"
    );
    expect(screen.getAllByTestId(/test-option-/i)).toHaveLength(4);

    fireEvent.click(screen.getByTestId("test-option-0"));
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});

