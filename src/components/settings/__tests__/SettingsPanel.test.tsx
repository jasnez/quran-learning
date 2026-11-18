/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "../SettingsPanel";

const mockSetTheme = vi.fn();
const mockSetArabicFontSize = vi.fn();
const mockSetArabicFontStyle = vi.fn();
const mockToggleTransliteration = vi.fn();
const mockToggleTranslation = vi.fn();
const mockToggleTajwidColors = vi.fn();
const mockSetReciter = vi.fn();
const mockSetPlaybackSpeed = vi.fn();
const mockCycleRepeatMode = vi.fn();
const mockSetRepeatMode = vi.fn();
const mockToggleAutoPlayNext = vi.fn();

const defaultStore = {
  theme: "light" as const,
  arabicFontSize: 28,
  arabicFontStyle: "naskh" as "naskh" | "uthmanic",
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  selectedReciterId: "mishary-alafasy",
  playbackSpeed: 1,
  repeatMode: "off" as "off" | "surah" | "ayah",
  autoPlayNext: true,
  setTheme: mockSetTheme,
  setArabicFontSize: mockSetArabicFontSize,
  setArabicFontStyle: mockSetArabicFontStyle,
  toggleTransliteration: mockToggleTransliteration,
  toggleTranslation: mockToggleTranslation,
  toggleTajwidColors: mockToggleTajwidColors,
  setReciter: mockSetReciter,
  setPlaybackSpeed: mockSetPlaybackSpeed,
  cycleRepeatMode: mockCycleRepeatMode,
  setRepeatMode: mockSetRepeatMode,
  toggleAutoPlayNext: mockToggleAutoPlayNext,
};

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: typeof defaultStore) => unknown) => selector(defaultStore)),
}));

const offline = vi.hoisted(() => {
  const initial = {
    status: "idle" as string,
    error: null as string | null,
    progress: 0,
    total: 114,
    progressPercent: 0,
    availableCount: 0,
    failures: [] as { surah: number; reason: string; httpStatus?: number }[],
    failedAssetCount: 0,
  };
  return { initial, state: { ...initial }, start: vi.fn(), retry: vi.fn(), cancel: vi.fn() };
});

vi.mock("@/hooks/useOfflineDownload", () => ({
  TOTAL_SURAHS: 114,
  useOfflineDownload: () => ({ ...offline.state, start: offline.start, retry: offline.retry, cancel: offline.cancel }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  offline.state = { ...offline.initial };
  cleanup();
  document.body.innerHTML = "";
  defaultStore.theme = "light";
  defaultStore.arabicFontSize = 28;
  defaultStore.arabicFontStyle = "naskh";
  defaultStore.showTransliteration = true;
  defaultStore.showTranslation = true;
  defaultStore.showTajwidColors = true;
  defaultStore.playbackSpeed = 1;
  defaultStore.repeatMode = "off";
  defaultStore.autoPlayNext = true;
});

describe("SettingsPanel", () => {
  it("when open, renders panel with settings content", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: /settings|postavke/i })).toBeInTheDocument();
  });

  // QA section 5: the closed panel was aria-hidden but its ~24 controls stayed in the Tab order.
  it("when closed, is a closed native dialog, so its controls are out of the Tab order", () => {
    const { container } = render(<SettingsPanel isOpen={false} onClose={() => {}} />);
    const dialog = container.querySelector("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog!.open).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /zatvori/i })).not.toBeInTheDocument();
  });

  it("opens as a modal (showModal), which makes the page inert and keeps focus in the panel", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    const { container, rerender } = render(<SettingsPanel isOpen={false} onClose={() => {}} />);
    expect(showModal).not.toHaveBeenCalled();
    rerender(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(showModal).toHaveBeenCalledTimes(1);
    const dialog = container.querySelector("dialog")!;
    expect(dialog.open).toBe(true);
    // The native modal already is a named, modal dialog; no hand-made ARIA on top.
    expect(dialog).not.toHaveAttribute("role");
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(dialog).not.toHaveAttribute("aria-hidden");
    expect(screen.getByRole("dialog", { name: "Postavke" })).toBe(dialog);
    showModal.mockRestore();
  });

  // The slide-out keeps the closed dialog on screen for 200ms (display is transitioned); its
  // controls must not take focus or clicks in that time.
  it("is inert while closed, already when close() starts the exit animation", () => {
    const inertAtClose: boolean[] = [];
    const close = vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (this: HTMLDialogElement) {
      inertAtClose.push(this.hasAttribute("inert"));
      this.removeAttribute("open");
    });
    try {
      const { container, rerender } = render(<SettingsPanel isOpen={false} onClose={() => {}} />);
      const dialog = container.querySelector("dialog")!;
      expect(dialog).toHaveAttribute("inert");
      rerender(<SettingsPanel isOpen={true} onClose={() => {}} />);
      expect(dialog).not.toHaveAttribute("inert");
      rerender(<SettingsPanel isOpen={false} onClose={() => {}} />);
      expect(inertAtClose).toEqual([true]);
      expect(dialog).toHaveAttribute("inert");
    } finally {
      close.mockRestore();
    }
  });

  it("closes the dialog when the parent closes it", () => {
    const { container, rerender } = render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    rerender(<SettingsPanel isOpen={false} onClose={() => {}} />);
    expect(container.querySelector("dialog")!.open).toBe(false);
  });

  it("reports a close by the browser (Esc, back gesture, light dismiss) through onClose", () => {
    const onClose = vi.fn();
    const { container } = render(<SettingsPanel isOpen={true} onClose={onClose} />);
    container.querySelector("dialog")!.close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has Display Settings section with font size control", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/display|prikaz|font size|veličina fonta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decrease|smanji|minus|-/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase|povećaj|plus|\+/i })).toBeInTheDocument();
  });

  it("has Arabic font style options (Naskh, Scheherazade)", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/stil arapskog fonta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /naskh.*zaobljen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /scheherazade/i })).toBeInTheDocument();
    expect(screen.queryByText(/uthmanic/i)).toBeNull();
  });

  it("clicking Scheherazade calls setArabicFontStyle with \"uthmanic\" (saved key unchanged)", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const uthmanicBtn = screen.getByRole("button", { name: /scheherazade/i });
    await user.click(uthmanicBtn);
    expect(mockSetArabicFontStyle).toHaveBeenCalledWith("uthmanic");
  });

  it("clicking Naskh (zaobljen) calls setArabicFontStyle with \"naskh\"", async () => {
    const user = userEvent.setup();
    defaultStore.arabicFontStyle = "uthmanic";
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const naskhBtn = screen.getByRole("button", { name: /naskh.*zaobljen/i });
    await user.click(naskhBtn);
    expect(mockSetArabicFontStyle).toHaveBeenCalledWith("naskh");
  });

  it("has transliteration toggle in Display section", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const toggle = screen.getByRole("switch", { name: /transliteration|transliteracija/i });
    expect(toggle).toBeInTheDocument();
  });

  it("has translation toggle in Display section", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("switch", { name: /translation|prijevod/i })).toBeInTheDocument();
  });

  it("has tajwid colors toggle in Display section", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("switch", { name: /tedžvid boje/i })).toBeInTheDocument();
  });

  it("has Audio Settings section with reciter and speed", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: /zvuk/i })).toBeInTheDocument();
    expect(screen.getByText(/Mishary Alafasy/i)).toBeInTheDocument();
    expect(screen.getByText(/brzina reprodukcije/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\.5x|1,5x/i })).toBeInTheDocument();
  });

  it("has repeat mode and auto-play next controls", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole("group", { name: /ponavljanje/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /auto-play|sljedeći ajet|next ayah/i })).toBeInTheDocument();
  });

  // QA section 5: repeat has three states, so a two-state switch (on/off) misreports it.
  it("offers the three repeat modes as one group of options with the current one pressed", () => {
    defaultStore.repeatMode = "surah";
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.queryByRole("switch", { name: /ponavljanje/i })).not.toBeInTheDocument();
    const group = within(screen.getByRole("group", { name: /ponavljanje/i }));
    expect(group.getByRole("button", { name: "Isključeno" })).toHaveAttribute("aria-pressed", "false");
    expect(group.getByRole("button", { name: "Sura" })).toHaveAttribute("aria-pressed", "true");
    expect(group.getByRole("button", { name: "Ajet" })).toHaveAttribute("aria-pressed", "false");
  });

  it("has Theme section with Light and Dark; Sepia hidden behind 'Više opcija' (advanced)", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/theme|tema/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /light|svijetla/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dark|tamna/i })).toBeInTheDocument();
    // Sepia ne smije biti vidljiv po default-u
    expect(screen.queryByRole("radio", { name: /sepia/i })).not.toBeInTheDocument();
    const moreBtn = screen.getByRole("button", { name: /više opcija/i });
    await userEvent.click(moreBtn);
    expect(screen.getByRole("radio", { name: /sepia/i })).toBeInTheDocument();
  });

  it("calling onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole("button", { name: /close|zatvori/i });
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("light dismiss where the browser has no closedby (Safari)", () => {
    function renderOpenPanel(onClose: () => void) {
      const { container } = render(<SettingsPanel isOpen={true} onClose={onClose} />);
      const dialog = container.querySelector("dialog")!;
      // The panel is the right-hand strip from x=400; everything left of it is the backdrop.
      vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
        left: 400, right: 800, top: 0, bottom: 600, width: 400, height: 600, x: 400, y: 0,
        toJSON: () => ({}),
      } as DOMRect);
      return dialog;
    }

    it("closes on a press and release on the backdrop", () => {
      expect("closedBy" in HTMLDialogElement.prototype).toBe(false);
      const onClose = vi.fn();
      const dialog = renderOpenPanel(onClose);
      fireEvent.pointerDown(dialog, { clientX: 100, clientY: 300 });
      fireEvent.pointerUp(dialog, { clientX: 100, clientY: 300 });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(dialog.open).toBe(false);
    });

    it("stays open for a press inside the panel, also when it ends on the backdrop (text selection)", () => {
      const onClose = vi.fn();
      const dialog = renderOpenPanel(onClose);
      fireEvent.pointerDown(dialog, { clientX: 500, clientY: 300 });
      fireEvent.pointerUp(dialog, { clientX: 500, clientY: 300 });
      fireEvent.pointerDown(dialog, { clientX: 500, clientY: 300 });
      fireEvent.pointerUp(dialog, { clientX: 100, clientY: 300 });
      expect(onClose).not.toHaveBeenCalled();
      expect(dialog.open).toBe(true);
    });
  });

  it("font size decrease button calls setArabicFontSize with smaller value", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const decrease = screen.getByRole("button", { name: /decrease|smanji|minus|-/i });
    await userEvent.click(decrease);
    expect(mockSetArabicFontSize).toHaveBeenCalledWith(24);
  });

  it("font size increase button calls setArabicFontSize with larger value", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const increase = screen.getByRole("button", { name: /increase|povećaj|plus|\+/i });
    await userEvent.click(increase);
    expect(mockSetArabicFontSize).toHaveBeenCalledWith(32);
  });

  it("font size cannot go below 20", async () => {
    defaultStore.arabicFontSize = 20;
    const { useSettingsStore } = await import("@/store/settingsStore");
    vi.mocked(useSettingsStore).mockImplementation((s) =>
      s(defaultStore as unknown as ReturnType<typeof useSettingsStore.getState>)
    );
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const decrease = screen.getByRole("button", { name: /decrease|smanji|minus|-/i });
    expect(decrease).toBeDisabled();
  });

  it("font size cannot exceed 44", async () => {
    defaultStore.arabicFontSize = 44;
    const { useSettingsStore } = await import("@/store/settingsStore");
    vi.mocked(useSettingsStore).mockImplementation((s) =>
      s(defaultStore as unknown as ReturnType<typeof useSettingsStore.getState>)
    );
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const increase = screen.getByRole("button", { name: /increase|povećaj|plus|\+/i });
    expect(increase).toBeDisabled();
  });

  it("toggling transliteration switch calls toggleTransliteration", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const toggle = screen.getByRole("switch", { name: /transliteration|transliteracija/i });
    await userEvent.click(toggle);
    expect(mockToggleTransliteration).toHaveBeenCalled();
  });

  // The theme radios are visually hidden inside their labels, so the label shows the focus.
  it("theme options show a focus ring when their radio has keyboard focus", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /više opcija/i }));
    for (const name of [/svijetla/i, /tamna/i, /sepia/i]) {
      const label = screen.getByRole("radio", { name }).closest("label");
      expect(label).toHaveClass("has-[:focus-visible]:ring-2", "has-[:focus-visible]:ring-emerald-600");
    }
  });

  it("selecting Dark theme calls setTheme with dark", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const dark = screen.getByRole("radio", { name: /dark|tamna/i });
    await userEvent.click(dark);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("selecting Sepia theme (after expanding advanced) calls setTheme with sepia", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const moreBtn = screen.getByRole("button", { name: /više opcija/i });
    await userEvent.click(moreBtn);
    const sepia = screen.getByRole("radio", { name: /sepia/i });
    await userEvent.click(sepia);
    expect(mockSetTheme).toHaveBeenCalledWith("sepia");
  });

  it("clicking playback speed 1.5x calls setPlaybackSpeed with 1.5", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const speed = screen.getByRole("button", { name: /1\.5x|1,5x/i });
    await userEvent.click(speed);
    expect(mockSetPlaybackSpeed).toHaveBeenCalledWith(1.5);
  });

  it("choosing a repeat mode sets exactly that mode", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const group = within(screen.getByRole("group", { name: /ponavljanje/i }));
    await userEvent.click(group.getByRole("button", { name: "Ajet" }));
    expect(mockSetRepeatMode).toHaveBeenCalledWith("ayah");
    expect(mockCycleRepeatMode).not.toHaveBeenCalled();
  });

  it("auto-play next switch calls toggleAutoPlayNext", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const toggle = screen.getByRole("switch", { name: /auto-play|sljedeći|next ayah/i });
    await userEvent.click(toggle);
    expect(mockToggleAutoPlayNext).toHaveBeenCalled();
  });
});

describe("SettingsPanel offline download", () => {
  function offlineRegion() {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    return within(screen.getByRole("region", { name: /offline čitanje/i }));
  }

  it("says plainly that the download is text only and audio needs the internet", () => {
    const region = offlineRegion();
    expect(region.getByText(/audio.*nije uključen/i)).toBeInTheDocument();
  });

  it("shows how many surahs are already saved after a reload", () => {
    offline.state.availableCount = 10;
    const region = offlineRegion();
    expect(region.getByText(/10 od 114/)).toBeInTheDocument();
  });

  it("shows done only with every surah saved", () => {
    offline.state.status = "done";
    offline.state.availableCount = 114;
    const region = offlineRegion();
    expect(region.getByText(/svih 114 sura je spremljeno/i)).toBeInTheDocument();
  });

  it("names the surahs that failed and retries only those", async () => {
    offline.state.status = "error";
    offline.state.error = "incomplete";
    offline.state.availableCount = 112;
    offline.state.failures = [
      { surah: 5, reason: "network" },
      { surah: 17, reason: "http", httpStatus: 500 },
    ];
    const region = offlineRegion();
    expect(region.getByText(/5, 17/)).toBeInTheDocument();
    await userEvent.click(region.getByRole("button", { name: /pokušaj ponovo/i }));
    expect(offline.retry).toHaveBeenCalled();
    expect(offline.start).not.toHaveBeenCalled();
  });

  it("reports static files that were not saved", () => {
    offline.state.status = "error";
    offline.state.error = "incomplete";
    offline.state.availableCount = 114;
    offline.state.failedAssetCount = 2;
    const region = offlineRegion();
    expect(region.getByText(/datoteke aplikacije koje nisu spremljene: 2/i)).toBeInTheDocument();
  });

  it("explains that nothing was saved when the service worker does not control the page", () => {
    offline.state.status = "error";
    offline.state.error = "not-controlled";
    const region = offlineRegion();
    expect(region.getByText(/ništa nije spremljeno/i)).toBeInTheDocument();
    expect(region.getByText(/osvježite stranicu/i)).toBeInTheDocument();
  });

  it("says when the browser cannot save pages for offline use", () => {
    offline.state.status = "unsupported";
    const region = offlineRegion();
    expect(region.getByText(/ne podržava/i)).toBeInTheDocument();
    expect(region.queryByRole("button", { name: /preuzmi/i })).toBeNull();
  });
});
