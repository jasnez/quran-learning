/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mocks for server-side helpers that profile page will use
const serverAuthMocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
  getServerUserRequireConfirmed: vi.fn(),
}));

const profileStatsMocks = vi.hoisted(() => ({
  getProfileStats: vi.fn(),
}));
const getProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/serverAuth", () => serverAuthMocks);
vi.mock("@/lib/profile/profileStats", () => profileStatsMocks);
vi.mock("@/lib/profile/getProfile", () => ({ getProfile: getProfileMock }));

const redirect = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
  useRouter: () => ({ push }),
}));

// Import after mocks so page uses them
import ProfilePage from "../page";

const { getServerUserRequireConfirmed } = serverAuthMocks;
const { getProfileStats } = profileStatsMocks;

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /auth/login when user is not authenticated", async () => {
    getServerUserRequireConfirmed.mockImplementationOnce(async () => {
      redirect("/auth/login");
      throw new Error("NEXT_REDIRECT");
    });

    await expect(ProfilePage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("renders user info and stats when authenticated", async () => {
    const user = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { full_name: "Test User" },
      created_at: "2025-01-01T00:00:00.000Z",
    };

    getServerUserRequireConfirmed.mockResolvedValueOnce(user);

    getProfileMock.mockResolvedValueOnce({
      displayName: "Test User",
      avatarUrl: null,
    });
    getProfileStats.mockResolvedValueOnce({
      totalSurahsStarted: 5,
      totalSurahsCompleted: 2,
      totalAyahsListened: 120,
      totalListeningTimeMs: 360000,
      longestStreakDays: 4,
      favoriteSurahName: "Al-Fatihah",
    });

    const Page = await ProfilePage();
    render(Page);

    expect(
      screen.getByRole("heading", { name: /profil|tvoj profil/i })
    ).toBeInTheDocument();

    // User name, email, and editable profile
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /uredi/i })).toBeInTheDocument();

    // Stats summary
    expect(
      screen.getByText(/ukupno sura započetih/i)
    ).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(
      screen.getByText(/završene sure/i)
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(
      screen.getByText(/ukupno preslušanih ajeta/i)
    ).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();

    expect(
      screen.getByText(/najčešće slušana sura/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/al-fatihah/i)).toBeInTheDocument();

    // Quick links
    expect(
      screen.getByRole("link", { name: /zabilješke/i })
    ).toHaveAttribute("href", "/bookmarks");
    expect(
      screen.getByRole("link", { name: /napredak/i })
    ).toHaveAttribute("href", "/progress");
    expect(
      screen.getByRole("link", { name: /postavke/i })
    ).toHaveAttribute("href", "/settings");

    // Account section
    expect(
      screen.getByRole("link", { name: /promijeni lozinku/i })
    ).toHaveAttribute("href", "/profile/change-password");
    const deleteBtn = screen.getByRole("button", { name: /obriši račun/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click delete opens confirmation dialog
    await userEvent.click(deleteBtn);
    expect(
      screen.getByRole("dialog", { name: /obriši račun/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/jesi li siguran|nepovratan/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /odustani/i })).toBeInTheDocument();
  });
});

