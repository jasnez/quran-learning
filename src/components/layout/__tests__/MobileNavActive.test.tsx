/**
 * @vitest-environment jsdom
 */
// QA P2-8: the bottom navigation showed no active tab on a surah page (/surah/2).
// The active tab comes from the route tree, like the Header back link: the static
// 404.html is served for unknown URLs such as /surah/115 (see HeaderHydration.test.tsx).
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { collectHydrationErrors } from "@/test-utils/hydration";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
import { MobileNav } from "../MobileNav";

const route = vi.hoisted(() => ({ pathname: "/", segment: null as string | null }));

vi.mock("next/navigation", async (orig) => ({
  ...((await orig()) as Record<string, unknown>),
  usePathname: () => route.pathname,
  useSelectedLayoutSegment: () => route.segment,
}));

const nav = (
  <SettingsOpenProvider>
    <MobileNav />
  </SettingsOpenProvider>
);

function currentTab(): string | null {
  return document.querySelector("nav [aria-current='page']")?.textContent ?? null;
}

afterEach(() => cleanup());

describe("MobileNav active tab", () => {
  it.each([
    ["/surahs", "surahs"],
    ["/surah/2", "surah"],
    ["/juz/1", "juz"],
  ])("marks Sure as current on %s", (pathname, segment) => {
    route.pathname = pathname;
    route.segment = segment;
    render(nav);
    expect(currentTab()).toBe("Sure");
  });

  it("marks Početna as current on the home page", () => {
    route.pathname = "/";
    route.segment = null;
    render(nav);
    expect(currentTab()).toBe("Početna");
  });

  it("marks no tab on the 404 page and hydrates it at an unknown /surah/ URL", async () => {
    route.pathname = "/_not-found";
    route.segment = "/_not-found";
    const errors = await collectHydrationErrors(nav, {
      beforeHydrate: () => {
        route.pathname = "/surah/115";
      },
    });
    expect(errors).toEqual([]);
    render(nav);
    expect(screen.getByRole("navigation", { name: "Mobilna navigacija" })).toBeInTheDocument();
    expect(currentTab()).toBeNull();
  });
});
