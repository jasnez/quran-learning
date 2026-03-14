/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

describe("Auth /register page", () => {
  it("renders registration form", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: /registracija|kreiraj račun/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lozinka/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /registruj se|kreiraj račun/i })
    ).toBeInTheDocument();
  });
});

