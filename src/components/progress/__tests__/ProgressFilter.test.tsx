/**
 * @vitest-environment jsdom
 *
 * The surah filter on the progress page: the chosen chip is a pressed toggle and looks unlike
 * the others (filled accent), not only a slightly different wash.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import surahs from "@/data/surahs.json";
import type { SurahSummary } from "@/types/quran";
import { ProgressContent } from "../ProgressContent";

describe("progress filter", () => {
  it("marks the chosen filter with aria-pressed and the filled accent style", async () => {
    render(<ProgressContent surahs={surahs as SurahSummary[]} />);
    const all = await screen.findByRole("button", { name: "Sve" });
    const done = screen.getByRole("button", { name: "Završene" });
    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(done).toHaveAttribute("aria-pressed", "false");
    expect(all).toHaveClass("bg-accent", "text-on-accent");

    await userEvent.click(done);
    expect(done).toHaveAttribute("aria-pressed", "true");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(done).toHaveClass("bg-accent", "text-on-accent");
    expect(all).not.toHaveClass("bg-accent");
  });
});
