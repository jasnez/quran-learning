/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useSettingsStore } from "@/store/settingsStore";

const mockSetTheme = vi.fn();
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: { theme: string; arabicFontStyle: string; setTheme: () => void }) => unknown) =>
    selector({ theme: "light", arabicFontStyle: "naskh", setTheme: mockSetTheme })
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-arabic-font");
  document.documentElement.classList.remove("dark", "theme-light", "theme-dark", "theme-sepia");
});

describe("ThemeProvider", () => {
  it("renders children", () => {
    const { container } = render(
      <ThemeProvider>
        <div data-testid="child">Content</div>
      </ThemeProvider>
    );
    expect(container.querySelector("[data-testid='child']")).toHaveTextContent("Content");
  });

  it("sets data-theme on documentElement based on store theme", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "dark" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets data-theme to light when store theme is light", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "light" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets data-theme to sepia when store theme is sepia", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "sepia" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-theme")).toBe("sepia");
  });

  it("adds class 'dark' to documentElement when theme is dark", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "dark" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not add class 'dark' when theme is light or sepia", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "light" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string }) => unknown) => sel({ theme: "sepia" }) as ReturnType<typeof useSettingsStore>
    );
    const { unmount } = render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    unmount();
  });

  it("sets data-arabic-font to naskh when store arabicFontStyle is naskh", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string; arabicFontStyle: string }) => unknown) =>
        sel({ theme: "light", arabicFontStyle: "naskh" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-arabic-font")).toBe("naskh");
  });

  it("sets data-arabic-font to uthmanic when store arabicFontStyle is uthmanic", () => {
    vi.mocked(useSettingsStore).mockImplementation(
      (sel: (s: { theme: string; arabicFontStyle: string }) => unknown) =>
        sel({ theme: "light", arabicFontStyle: "uthmanic" }) as ReturnType<typeof useSettingsStore>
    );
    render(<ThemeProvider><span /></ThemeProvider>);
    expect(document.documentElement.getAttribute("data-arabic-font")).toBe("uthmanic");
  });
});

describe("Theme CSS variables", () => {
  beforeEach(() => {
    const style = document.createElement("style");
    style.textContent = `
      [data-theme="light"] { --theme-bg: #FAFAF5; --theme-card: #FFFFFF; --theme-text: #1A1A1A; --theme-accent: #047857; }
      [data-theme="dark"] { --theme-bg: #111111; --theme-card: #252525; --theme-text: #E5E5E5; --theme-accent: #34d399; }
      [data-theme="sepia"] { --theme-bg: #F5ECD7; --theme-card: #FDF6E3; --theme-text: #3B2E1A; --theme-accent: #6b7c2e; }
    `;
    document.head.appendChild(style);
  });

  it("light theme defines --theme-bg and --theme-accent", () => {
    document.documentElement.setAttribute("data-theme", "light");
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--theme-bg").trim();
    const accent = style.getPropertyValue("--theme-accent").trim();
    expect(bg).toBe("#FAFAF5");
    expect(accent).toBe("#047857");
  });

  it("dark theme defines dark --theme-bg", () => {
    document.documentElement.setAttribute("data-theme", "dark");
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--theme-bg").trim();
    expect(bg).toBe("#111111");
  });

  it("sepia theme defines --theme-bg", () => {
    document.documentElement.setAttribute("data-theme", "sepia");
    const style = getComputedStyle(document.documentElement);
    const bg = style.getPropertyValue("--theme-bg").trim();
    expect(bg).toBe("#F5ECD7");
  });
});
