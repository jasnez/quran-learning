/**
 * @vitest-environment jsdom
 *
 * The one-time notice about the new tajwid colors (Phase 3, D7). It used to fire when the legend
 * mounted; the legend now lives in the settings sheet, so the reading screens fire it.
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useSettingsStore } from "@/store/settingsStore";
import { useToastStore } from "@/store/toastStore";
import { useTajwidNotice } from "../useTajwidNotice";

const NOTICE = "Boje su sada kao u tedžvidskom mushafu.";

function Screen() {
  useTajwidNotice();
  return null;
}

beforeEach(() => {
  useSettingsStore.setState({ tajwidNoticeSeen: true, showTajwidColors: true });
  useToastStore.getState().clearToast();
});
afterEach(cleanup);

describe("useTajwidNotice", () => {
  it("shows the notice once for someone who used the old colors, then remembers it", () => {
    useSettingsStore.setState({ tajwidNoticeSeen: false });
    const before = useToastStore.getState().showCount;
    render(<Screen />);
    expect(useToastStore.getState().message).toBe(NOTICE);
    expect(useToastStore.getState().showCount).toBe(before + 1);
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(true);

    cleanup();
    render(<Screen />);
    expect(useToastStore.getState().showCount).toBe(before + 1);
  });

  it("shows nothing when the notice was already seen", () => {
    const before = useToastStore.getState().showCount;
    render(<Screen />);
    expect(useToastStore.getState().showCount).toBe(before);
  });

  it("waits while the colors are off: nothing to announce, and the notice is kept for later", () => {
    useSettingsStore.setState({ tajwidNoticeSeen: false, showTajwidColors: false });
    const before = useToastStore.getState().showCount;
    render(<Screen />);
    expect(useToastStore.getState().showCount).toBe(before);
    expect(useSettingsStore.getState().tajwidNoticeSeen).toBe(false);
  });
});
