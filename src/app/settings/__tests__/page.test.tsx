/**
 * @vitest-environment jsdom
 */
// QA P2-6: /settings rendered a second settings dialog next to the one AppShell
// renders (duplicate IDs), and "Zatvori" called router.back(), which does nothing
// in a new tab or an installed app, so the overlay stayed over the page.
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SettingsOpenProvider, useSettingsOpen } from "@/contexts/SettingsOpenContext";
import SettingsPage from "../page";

const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", async (orig) => ({
  ...((await orig()) as Record<string, unknown>),
  useRouter: () => router,
}));

// Stands in for the AppShell panel: shows its state and closes it like its "Zatvori" button.
function PanelProbe() {
  const { isOpen, close } = useSettingsOpen();
  return (
    <>
      <p>{isOpen ? "panel open" : "panel closed"}</p>
      <button type="button" onClick={close}>
        Zatvori panel
      </button>
    </>
  );
}

function renderPage() {
  return render(
    <SettingsOpenProvider>
      <SettingsPage />
      <PanelProbe />
    </SettingsOpenProvider>
  );
}

beforeEach(() => {
  router.back.mockClear();
  router.replace.mockClear();
});
afterEach(() => cleanup());

describe("/settings page", () => {
  it("opens the shared settings panel instead of rendering its own dialog", () => {
    renderPage();
    expect(screen.getByText("panel open")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("goes to the home page on close when there is no page to go back to", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    renderPage();
    act(() => screen.getByRole("button", { name: "Zatvori panel" }).click());
    expect(router.replace).toHaveBeenCalledWith("/");
    expect(router.back).not.toHaveBeenCalled();
  });

  it("goes back on close when the user came from another page", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(3);
    renderPage();
    act(() => screen.getByRole("button", { name: "Zatvori panel" }).click());
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });
});
