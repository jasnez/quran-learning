/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../page";

describe("Auth /login page", () => {
  it("renders calm premium login form", () => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: /prijava/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lozinka/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prijavi se/i })).toBeInTheDocument();
  });

  it("has link to registration and forgot password", () => {
    render(<Page />);
    const registerLinks = screen.getAllByRole("link", { name: /registruj se|kreiraj račun/i });
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
    const forgotLinks = screen.getAllByRole("link", { name: /zaboravljena lozinka/i });
    expect(forgotLinks.length).toBeGreaterThanOrEqual(1);
  });
});

