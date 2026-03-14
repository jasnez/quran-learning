/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
const mockToggleAutoPlayNext = vi.fn();

const defaultStore = {
  theme: "light" as const,
  arabicFontSize: 28,
  arabicFontStyle: "naskh" as const,
  showTransliteration: true,
  showTranslation: true,
  showTajwidColors: true,
  selectedReciterId: "mishary-alafasy",
  playbackSpeed: 1,
  repeatMode: "off" as const,
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
  toggleAutoPlayNext: mockToggleAutoPlayNext,
};

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: typeof defaultStore) => unknown) => selector(defaultStore)),
}));

beforeEach(() => {
  vi.clearAllMocks();
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

  it("when closed, panel is hidden (aria-hidden or off-screen)", () => {
    const { container } = render(<SettingsPanel isOpen={false} onClose={() => {}} />);
    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("has Display Settings section with font size control", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/display|prikaz|font size|veličina fonta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decrease|smanji|minus|-/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase|povećaj|plus|\+/i })).toBeInTheDocument();
  });

  it("has Arabic font style options (Naskh, Uthmanic HAFS)", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/stil arapskog fonta/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /naskh.*zaobljen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /uthmanic hafs/i })).toBeInTheDocument();
  });

  it("clicking Uthmanic HAFS calls setArabicFontStyle with \"uthmanic\"", async () => {
    const user = userEvent.setup();
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const uthmanicBtn = screen.getByRole("button", { name: /uthmanic hafs/i });
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
    expect(screen.getByRole("switch", { name: /tajwid|tajvid/i })).toBeInTheDocument();
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
    expect(screen.getByRole("switch", { name: /ponavljanje/i })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /auto-play|sljedeći ajet|next ayah/i })).toBeInTheDocument();
  });

  it("has Theme section with Light, Dark, Sepia options", () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/theme|tema/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /light|svijetla/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dark|tamna/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /sepia/i })).toBeInTheDocument();
  });

  it("calling onClose when close button clicked", async () => {
    const onClose = vi.fn();
    render(<SettingsPanel isOpen={true} onClose={onClose} />);
    const closeBtn = screen.getByRole("button", { name: /close|zatvori/i });
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking overlay calls onClose", async () => {
    const onClose = vi.fn();
    const { container } = render(<SettingsPanel isOpen={true} onClose={onClose} />);
    const overlay = container.querySelector("[data-settings-overlay]");
    expect(overlay).toBeInTheDocument();
    if (overlay) await userEvent.click(overlay as HTMLElement);
    expect(onClose).toHaveBeenCalled();
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
    vi.mocked(useSettingsStore).mockImplementation((s: (x: typeof defaultStore) => unknown) =>
      s(defaultStore)
    );
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const decrease = screen.getByRole("button", { name: /decrease|smanji|minus|-/i });
    expect(decrease).toBeDisabled();
  });

  it("font size cannot exceed 44", async () => {
    defaultStore.arabicFontSize = 44;
    const { useSettingsStore } = await import("@/store/settingsStore");
    vi.mocked(useSettingsStore).mockImplementation((s: (x: typeof defaultStore) => unknown) =>
      s(defaultStore)
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

  it("selecting Dark theme calls setTheme with dark", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const dark = screen.getByRole("radio", { name: /dark|tamna/i });
    await userEvent.click(dark);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("selecting Sepia theme calls setTheme with sepia", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
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

  it("repeat mode control calls cycleRepeatMode", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const control = screen.getByRole("switch", { name: /ponavljanje/i });
    await userEvent.click(control);
    expect(mockCycleRepeatMode).toHaveBeenCalled();
  });

  it("auto-play next switch calls toggleAutoPlayNext", async () => {
    render(<SettingsPanel isOpen={true} onClose={() => {}} />);
    const toggle = screen.getByRole("switch", { name: /auto-play|sljedeći|next ayah/i });
    await userEvent.click(toggle);
    expect(mockToggleAutoPlayNext).toHaveBeenCalled();
  });
});
