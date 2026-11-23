/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TajwidRuleBar } from "../TajwidRuleBar";
import { useTajwidRuleBarStore } from "@/store/tajwidRuleBarStore";
import { usePlayerStore } from "@/store/playerStore";

const route = vi.hoisted(() => ({ pathname: "/surah/1" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

function bar() {
  return screen.getByRole("status");
}

describe("TajwidRuleBar", () => {
  beforeEach(() => {
    cleanup();
    route.pathname = "/surah/1";
    useTajwidRuleBarStore.setState({ rule: null });
    usePlayerStore.setState({ activeAudioSrc: null });
  });

  it("keeps its status region in the DOM while closed, empty", () => {
    render(<TajwidRuleBar />);
    expect(bar()).toBeInTheDocument();
    expect(bar()).toHaveTextContent("");
    expect(screen.queryByRole("link", { name: "Lekcija" })).toBeNull();
  });

  it("open: the rule name in bold, one sentence, a lesson link and a close button", () => {
    render(<TajwidRuleBar />);
    act(() => useTajwidRuleBarStore.getState().open("qalqalah"));
    expect(bar()).toHaveTextContent("Kalkala: harf bez vokala ovdje odskoči, da se jasno čuje.");
    expect(screen.getByText("Kalkala").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "Lekcija" })).toHaveAttribute("href", "/tajwid/qalqalah-odskok");
    expect(screen.getByRole("button", { name: "Zatvori" })).toBeInTheDocument();
  });

  it("does not take focus when it opens", () => {
    render(
      <>
        <button type="button">elsewhere</button>
        <TajwidRuleBar />
      </>,
    );
    screen.getByRole("button", { name: "elsewhere" }).focus();
    act(() => useTajwidRuleBarStore.getState().open("mad"));
    expect(screen.getByRole("button", { name: "elsewhere" })).toHaveFocus();
  });

  it("closing with focus inside the bar moves focus to the main content, not to the page top", async () => {
    const user = userEvent.setup();
    render(
      <>
        <main id="main-content" tabIndex={-1}>content</main>
        <TajwidRuleBar />
      </>,
    );
    act(() => useTajwidRuleBarStore.getState().open("mad"));
    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    expect(screen.getByRole("main")).toHaveFocus();

    act(() => useTajwidRuleBarStore.getState().open("mad"));
    screen.getByRole("link", { name: "Lekcija" }).focus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("the next tap replaces the rule", () => {
    render(<TajwidRuleBar />);
    act(() => useTajwidRuleBarStore.getState().open("mad"));
    act(() => useTajwidRuleBarStore.getState().open("ghunnah"));
    expect(bar()).toHaveTextContent("Gunne: nun ili mim se ovdje uči kroz nos.");
  });

  it("closes on Zatvori, on Escape and on a route change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<TajwidRuleBar />);
    act(() => useTajwidRuleBarStore.getState().open("mad"));
    await user.click(screen.getByRole("button", { name: "Zatvori" }));
    expect(useTajwidRuleBarStore.getState().rule).toBeNull();

    act(() => useTajwidRuleBarStore.getState().open("ikhfa"));
    await user.keyboard("{Escape}");
    expect(useTajwidRuleBarStore.getState().rule).toBeNull();

    act(() => useTajwidRuleBarStore.getState().open("ikhfa"));
    route.pathname = "/surah/2";
    rerender(<TajwidRuleBar />);
    expect(useTajwidRuleBarStore.getState().rule).toBeNull();
  });

  it("sits above the mobile navigation, above the player too when audio is loaded, below the toast", () => {
    render(<TajwidRuleBar />);
    act(() => useTajwidRuleBarStore.getState().open("mad"));
    expect(bar().className).toMatch(/max-md:bottom-16/);
    expect(bar().className).toMatch(/z-\[45\]/);
    act(() => usePlayerStore.setState({ activeAudioSrc: "https://example.test/1.mp3" }));
    expect(bar().className).toMatch(/max-md:bottom-\[134px\]/);
    expect(bar().className).toMatch(/md:bottom-\[78px\]/);
  });
});
