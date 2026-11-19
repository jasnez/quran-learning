/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NotFound from "../not-found";
import SurahError from "../surah/[surahId]/error";
import LearnError from "../learn/[surahId]/error";
import SearchError from "../search/error";
import LessonError from "../tajwid/[lessonId]/error";

const error = Object.assign(new Error("boom"), { digest: "abc" });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.mocked(console.error).mockRestore();
});

describe("404 page", () => {
  it("says what is wrong without addressing the visitor", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Ova stranica ne postoji" })).toBeInTheDocument();
    expect(screen.getByText("Možda je adresa pogrešno upisana ili je stranica premještena.")).toBeInTheDocument();
  });
});

describe("route error pages say what happened, then what to do", () => {
  const cases = [
    ["surah", SurahError, "Sura se nije učitala", "Sve sure"],
    ["learn", LearnError, "Učenje se nije otvorilo", "Sve sure"],
    ["search", SearchError, "Pretraga se nije učitala", null],
    ["tajwid lesson", LessonError, "Lekcija se nije učitala", null],
  ] as const;

  for (const [name, Page, title, backLink] of cases) {
    it(name, () => {
      render(<Page error={error} reset={() => {}} />);
      expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
      expect(screen.getByText("Provjeri internet i pokušaj ponovo.")).toBeInTheDocument();
      if (backLink) expect(screen.getByRole("link", { name: backLink })).toHaveAttribute("href", "/surahs");
    });
  }
});
