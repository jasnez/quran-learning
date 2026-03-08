/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ContinueLearningSection } from "../ContinueLearningSection";

const mockStore = {
  lastSurahNumber: 1,
  lastAyahNumber: 5,
  lastMode: "reader" as const,
  lastSurahNameLatin: "Al-Fatihah",
  timestamp: new Date().toISOString(),
  totalListeningTimeMs: 125000,
  surahsVisited: [1],
  ayahsListened: 10,
  getOverallProgress: () => ({
    totalSurahsStarted: 1,
    totalAyahsListened: 10,
    totalAyahsRead: 0,
    overallCompletionPercent: 0.16,
  }),
};
vi.mock("@/store/progressStore", () => ({
  useProgressStore: vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ContinueLearningSection", () => {
  it("when overall progress exists, shows overall stat cards after mount", async () => {
    render(<ContinueLearningSection />);
    await waitFor(() => {
      expect(screen.getByTestId("overall-stats-cards")).toBeInTheDocument();
    });
    expect(screen.getByText("Sure započeto")).toBeInTheDocument();
    expect(screen.getByText("Ajeta preslušano")).toBeInTheDocument();
    expect(screen.getByText("Ukupno slušanje")).toBeInTheDocument();
    expect(screen.getByText("Napredak")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText(/10\/6236 ajeta/)).toBeInTheDocument();
  });

  it("formats listening time in stat cards", async () => {
    render(<ContinueLearningSection />);
    await waitFor(() => {
      const cards = screen.getAllByTestId("overall-stats-cards");
      expect(cards.length).toBeGreaterThanOrEqual(1);
      expect(cards[0]).toBeInTheDocument();
    });
    const cards = screen.getAllByTestId("overall-stats-cards");
    expect(cards[0]).toHaveTextContent("2 min");
  });
});
