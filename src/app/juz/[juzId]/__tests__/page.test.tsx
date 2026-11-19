/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { getAyahsForJuz } from "@/lib/data";
import JuzPage from "../page";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/reader", () => ({ JuzReaderContent: () => null }));

afterEach(cleanup);

describe("Juz page", () => {
  it("counts ayahs and surahs with the right plural forms", async () => {
    const segments = await getAyahsForJuz(1);
    const ayahCount = segments.reduce((acc, s) => acc + s.ayahs.length, 0);
    expect(ayahCount).toBe(148);
    render(await JuzPage({ params: Promise.resolve({ juzId: "1" }) }));
    expect(screen.getByText("148 ajeta · 2 sure")).toBeInTheDocument();
  });
});
