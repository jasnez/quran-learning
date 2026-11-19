/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ErrorPage from "../error";

afterEach(() => cleanup());

describe("Root error page (QA P1-7)", () => {
  it("says what happened and sends a repeating error to the Kontakt page", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={Object.assign(new Error("boom"), { digest: "abc" })} reset={() => {}} />);
    expect(screen.getByRole("heading", { level: 1, name: "Stranica se nije učitala" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Kontakt" });
    expect(link).toHaveAttribute("href", "/contact");
    expect(link).not.toHaveAttribute("target");
    expect(link.closest("p")).toHaveTextContent("Osvježi stranicu. Ako se greška ponovi, javi je preko stranice Kontakt.");
    vi.mocked(console.error).mockRestore();
  });
});
