/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";
import { SettingsOpenProvider } from "@/contexts/SettingsOpenContext";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

const authMocks = vi.hoisted(() => ({
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/authHelpers", () => authMocks);

describe("Header auth state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Prijava button when not authenticated", () => {
    authMocks.isAuthenticated.mockReturnValue(false);
    authMocks.getCurrentUser.mockReturnValue(null);

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const loginLink = screen.getByRole("link", { name: /prijava/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  it("shows user avatar/name and dropdown when authenticated", async () => {
    authMocks.isAuthenticated.mockReturnValue(true);
    authMocks.getCurrentUser.mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      user_metadata: { full_name: "Test User" },
    });

    render(
      <SettingsOpenProvider>
        <Header />
      </SettingsOpenProvider>
    );

    const userButton = screen.getByRole("button", { name: /test user|user@example.com/i });
    expect(userButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(userButton);

    expect(
      screen.getByRole("menuitem", { name: /profil/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /postavke/i })
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
  });
});


