/**
 * @vitest-environment jsdom
 *
 * WCAG 2.4.11: the header slides away while scrolling down; it must stay shown while
 * it holds focus, or the focused element would be hidden.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
import { Header } from "../Header";

vi.mock("../useStickyHeader", () => ({
  useStickyHeader: () => ({ isHidden: true, hasShadow: false }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSelectedLayoutSegment: () => null,
}));

afterEach(() => cleanup());

describe("Header while hidden by scrolling", () => {
  it("is shown while it holds focus and hidden again when focus leaves", () => {
    render(
      <SettingsOpenProvider>
        <Header />
        <button type="button">Izvan zaglavlja</button>
      </SettingsOpenProvider>
    );
    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-hidden", "true");
    expect(banner.className).toContain("-translate-y-full");

    act(() => screen.getByRole("link", { name: "Pretraga" }).focus());
    expect(banner).toHaveAttribute("data-hidden", "false");
    expect(banner.className).not.toContain("-translate-y-full");

    act(() => screen.getByRole("button", { name: "Izvan zaglavlja" }).focus());
    expect(banner).toHaveAttribute("data-hidden", "true");
  });
});
