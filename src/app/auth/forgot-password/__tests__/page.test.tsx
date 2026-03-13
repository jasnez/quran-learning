/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../page";

describe("Auth /forgot-password page", () => {
  it("renders password reset form", () => {
    render(<Page />);
    expect(
      screen.getByRole("heading", { name: /zaboravljena lozinka|reset lozinke/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pošalji link|pošalji upute/i })
    ).toBeInTheDocument();
  });
});

