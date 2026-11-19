/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
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
  // One surah started, 10 ayahs listened, none read.
  surahProgressMap: {
    1: {
      surahNumber: 1,
      ayahsListened: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      ayahsRead: new Set<number>(),
    },
  },
};
vi.mock("@/store/progressStore", async (importOriginal) => ({
  computeOverallProgress: (await importOriginal<typeof import("@/store/progressStore")>()).computeOverallProgress,
  useProgressStore: vi.fn((selector: (s: typeof mockStore) => unknown) => selector(mockStore)),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ContinueLearningSection", () => {
  it("when overall progress exists, shows overall stat cards after mount", async () => {
    render(<ContinueLearningSection />);
    await waitFor(() => {
      expect(screen.getByTestId("overall-stats-cards")).toBeInTheDocument();
    });
    expect(screen.getByText("Započete sure")).toBeInTheDocument();
    expect(screen.getByText("Preslušani ajeti")).toBeInTheDocument();
    expect(screen.getByText("Vrijeme slušanja")).toBeInTheDocument();
    expect(screen.getByText("Od cijelog Kur'ana")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("10 od 6.236 ajeta")).toBeInTheDocument();
  });

  it("opens the saved ayah from both buttons (QA P2-1)", async () => {
    render(<ContinueLearningSection />);
    expect(await screen.findByRole("link", { name: "Nastavi čitanje" })).toHaveAttribute("href", "/surah/1?ayah=5");
    expect(screen.getByRole("link", { name: "Uči ajet po ajet" })).toHaveAttribute("href", "/learn/1?ayah=5");
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

  it("shows the saved position as name, ordinal ayah and the mode with its age", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T12:00:00Z"));
    const saved = { ...mockStore };
    Object.assign(mockStore, {
      lastSurahNumber: 67,
      lastAyahNumber: 12,
      lastSurahNameLatin: "El-Mulk",
      timestamp: "2026-11-19T09:00:00Z",
    });
    try {
      render(<ContinueLearningSection />);
      expect(await screen.findByText("El-Mulk, 12. ajet")).toBeInTheDocument();
      expect(screen.getByText("Čitanje, prije 3 sata")).toBeInTheDocument();
    } finally {
      Object.assign(mockStore, saved);
    }
  });

  it("shows the welcome line when nothing is saved", async () => {
    const saved = { ...mockStore };
    Object.assign(mockStore, { lastSurahNumber: 0, surahProgressMap: {}, surahsVisited: [], ayahsListened: 0, totalListeningTimeMs: 0 });
    try {
      render(<ContinueLearningSection />);
      expect(await screen.findByText("Selam! Dobar početak su kratke sure ispod.")).toBeInTheDocument();
    } finally {
      Object.assign(mockStore, saved);
    }
  });

  it("labels the stats row with the counted thing first", async () => {
    const saved = { ...mockStore };
    Object.assign(mockStore, {
      surahsVisited: [1, 2, 3, 4, 5],
      ayahsListened: 12,
      totalListeningTimeMs: 0,
      surahProgressMap: {},
    });
    try {
      render(<ContinueLearningSection />);
      const row = await screen.findByTestId("progress-stats-row");
      expect(row).toHaveTextContent("Otvorene sure: 5");
      expect(row).toHaveTextContent("Preslušani ajeti: 12");
      expect(row).toHaveTextContent("Slušanje: 0 min");
    } finally {
      Object.assign(mockStore, saved);
    }
  });
});
