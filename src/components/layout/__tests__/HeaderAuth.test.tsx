/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";
import { useAuthStore } from "@/store/authStore";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/store/playerStore", () => {
  const state = {
    activeAudioSrc: null,
    currentSurahId: null,
    currentAyahId: null,
    isPlaying: false,
    resume: () => {},
    pause: () => {},
  };
  const usePlayerStoreMock = vi.fn((sel: (s: unknown) => unknown) => sel(state));
  (usePlayerStoreMock as { getState: () => typeof state }).getState = () => state;
  return { usePlayerStore: usePlayerStoreMock };
});

vi.mock("@/lib/audio/audioManager", () => ({
  loadAudio: () => {},
  play: () => {},
  pause: () => {},
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      repeatMode: "off",
      autoPlayNext: true,
      playbackSpeed: 1,
      cycleRepeatMode: () => {},
      toggleAutoPlayNext: () => {},
    })
  ),
}));

const signOutMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/auth/authHelpers", () => ({
  getCurrentUser: () => useAuthStore.getState().user,
  isAuthenticated: () => !!useAuthStore.getState().user,
  signOut: () => signOutMock(),
}));

const mockUser = {
  id: "user-1",
  email: "user@example.com",
  user_metadata: { full_name: "Test User" },
} as ReturnType<typeof useAuthStore.getState>["user"];

describe("Header auth state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setUser(null);
  });

  it("shows Prijava when not authenticated (desktop text and mobile icon)", () => {
    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const loginLinks = screen.getAllByRole("link", { name: /prijava/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute("href", "/auth/login");
  });

  it("shows account avatar when authenticated so mobile can access menu", () => {
    useAuthStore.getState().setUser(mockUser);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const accountButtons = screen.getAllByRole("button", { name: /korisnički meni/i });
    expect(accountButtons.length).toBeGreaterThanOrEqual(1);
    expect(accountButtons[0]).toHaveAttribute("aria-haspopup", "menu");
  });

  it("shows user avatar/name and dropdown when authenticated", async () => {
    useAuthStore.getState().setUser(mockUser);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const userButtons = screen.getAllByRole("button", { name: /korisnički meni/i });
    expect(userButtons.length).toBeGreaterThanOrEqual(1);
    const user = userEvent.setup();
    await user.click(userButtons[0]);

    expect(
      screen.getByRole("menuitem", { name: /profil/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /označeni|označeni ajeti|označeni/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /napredak/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /odjava/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /postavke/i })).not.toBeInTheDocument();
  });

  it("main nav has Sure, Učenje dropdown (Kviz, Tedžvid), Napredak but not Zabilješke text link", async () => {
    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );
    const sureLinks = screen.getAllByRole("link", { name: /^sure$/i });
    expect(sureLinks.length).toBeGreaterThanOrEqual(1);
    expect(sureLinks[0]).toHaveAttribute("href", "/surahs");

    const ucenjeBtns = screen.getAllByRole("button", { name: /učenje/i });
    expect(ucenjeBtns.length).toBeGreaterThanOrEqual(1);
    const user = userEvent.setup();
    await user.click(ucenjeBtns[0]);
    expect(screen.getByRole("menuitem", { name: /^kviz$/i })).toHaveAttribute("href", "/test/1");
    expect(screen.getByRole("menuitem", { name: /tedžvid lekcije/i })).toHaveAttribute("href", "/tajwid");

    const napredakLinks = screen.getAllByRole("link", { name: /^napredak$/i });
    expect(napredakLinks.length).toBeGreaterThanOrEqual(1);
    expect(napredakLinks[0]).toHaveAttribute("href", "/progress");
    expect(screen.queryByRole("link", { name: /zabilješke/i })).not.toBeInTheDocument();
    const bookmarkLinks = screen.getAllByRole("link", { name: /označeni ajeti/i });
    expect(bookmarkLinks.length).toBeGreaterThanOrEqual(1);
    expect(bookmarkLinks[0]).toHaveAttribute("href", "/bookmarks");
  });

  it("closes user menu when clicking a navigation item (Profil)", async () => {
    useAuthStore.getState().setUser(mockUser);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const user = userEvent.setup();
    const userButtons = screen.getAllByRole("button", { name: /korisnički meni/i });
    await user.click(userButtons[0]);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /profil/i }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("calls signOut when clicking Odjava", async () => {
    useAuthStore.getState().setUser(mockUser);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const user = userEvent.setup();
    const userButtons = screen.getAllByRole("button", { name: /korisnički meni/i });
    await user.click(userButtons[0]);
    await user.click(screen.getByRole("menuitem", { name: /odjava/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });

  it("after logout shows Prijava and redirects to home", async () => {
    signOutMock.mockImplementation(async () => {
      useAuthStore.getState().setUser(null);
    });
    useAuthStore.getState().setUser(mockUser);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const user = userEvent.setup();
    const userButtons = screen.getAllByRole("button", { name: /korisnički meni/i });
    await user.click(userButtons[0]);
    await user.click(screen.getByRole("menuitem", { name: /odjava/i }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    const prijavaLinks = screen.getAllByRole("link", { name: /prijava/i });
    expect(prijavaLinks.length).toBeGreaterThanOrEqual(1);
    expect(prijavaLinks[0]).toHaveAttribute("href", "/auth/login");
    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});


