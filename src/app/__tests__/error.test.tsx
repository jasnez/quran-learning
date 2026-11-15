/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorPage from "../error";
import { ISSUES_NEW_URL } from "@/lib/contact";

afterEach(() => cleanup());

describe("Root error page (QA P1-7)", () => {
  it("tells the user to report a repeating error on GitHub Issues", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={Object.assign(new Error("boom"), { digest: "abc" })} reset={() => {}} />);
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toHaveAttribute("href", ISSUES_NEW_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
    vi.mocked(console.error).mockRestore();
  });
});
