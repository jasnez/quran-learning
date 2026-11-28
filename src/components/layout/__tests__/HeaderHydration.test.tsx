/**
 * @vitest-environment jsdom
 */
// Regression test for React #418 on production 404 pages under /surah/ (e.g.
// /surah/115). The static export has one 404.html, rendered for the route
// /_not-found, and the host serves it for every unknown URL. On the client,
// usePathname() returns the real URL, while the route tree (and so
// useSelectedLayoutSegment) still describes /_not-found.
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { collectHydrationErrors } from "@/test-utils/hydration";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
import { Header } from "../Header";

const route = vi.hoisted(() => ({ pathname: "/", segment: null as string | null }));

vi.mock("next/navigation", async (orig) => ({
  ...((await orig()) as Record<string, unknown>),
  usePathname: () => route.pathname,
  useSelectedLayoutSegment: () => route.segment,
  useParams: () => (route.segment === "surah" ? { surahId: route.pathname.split("/")[2] } : {}),
}));

const header = (
  <SettingsOpenProvider>
    <Header />
  </SettingsOpenProvider>
);

afterEach(() => cleanup());

describe("Header back link to the surah list", () => {
  it("hydrates the 404 page served at an unknown /surah/ URL without a mismatch", async () => {
    route.pathname = "/_not-found";
    route.segment = "/_not-found";
    const errors = await collectHydrationErrors(header, {
      beforeHydrate: () => {
        route.pathname = "/surah/115";
      },
    });
    expect(errors).toEqual([]);
  });

  it("is shown on a surah page", () => {
    route.pathname = "/surah/2";
    route.segment = "surah";
    render(header);
    expect(screen.getByRole("link", { name: "Nazad na sve sure" })).toHaveAttribute("href", "/surahs");
  });

  it("is not shown on the surah list", () => {
    route.pathname = "/surahs";
    route.segment = "surahs";
    render(header);
    expect(screen.queryByRole("link", { name: "Nazad na sve sure" })).not.toBeInTheDocument();
  });
});
