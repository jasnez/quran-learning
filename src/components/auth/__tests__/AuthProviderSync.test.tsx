/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const mockAuth = vi.hoisted(() => ({
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({
    auth: mockAuth,
  })),
}));

const syncMocks = vi.hoisted(() => ({
  syncBookmarksToCloud: vi.fn().mockResolvedValue(undefined),
  syncSettingsToCloud: vi.fn().mockResolvedValue(undefined),
  syncProgressToCloud: vi.fn().mockResolvedValue(undefined),
  mergeLocalAndCloudData: vi.fn().mockResolvedValue(undefined),
  loadUserDataFromCloud: vi.fn().mockResolvedValue(undefined),
  loadBookmarksFromCloud: vi.fn().mockResolvedValue(undefined),
  loadProgressFromCloud: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/sync/dataSyncService", () => syncMocks);

vi.mock("@/lib/auth/authHelpers", () => ({
  ensureUserProfileAndSettings: vi.fn().mockResolvedValue(undefined),
  getBrowserClientAsync: vi.fn().mockResolvedValue({
    auth: mockAuth,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

import { AuthProvider } from "../AuthProvider";
const {
  syncBookmarksToCloud,
  syncSettingsToCloud,
  syncProgressToCloud,
  mergeLocalAndCloudData,
} = syncMocks;

describe("AuthProvider sync orchestration", () => {
  const user = {
    id: "user-123",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    mockAuth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs initial merge and sync when user is authenticated", async () => {
    render(
      <AuthProvider>
        <div>App</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mergeLocalAndCloudData).toHaveBeenCalledWith(user.id);
    });

    expect(syncBookmarksToCloud).toHaveBeenCalledWith(user.id);
    expect(syncSettingsToCloud).toHaveBeenCalledWith(user.id);
    expect(syncProgressToCloud).toHaveBeenCalledWith(user.id);
  });

  it("sets up periodic sync interval when user is authenticated", async () => {
    const spy = vi.spyOn(window, "setInterval");

    render(
      <AuthProvider>
        <div>App</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    const [fn, delay] = spy.mock.calls[0];
    expect(typeof fn).toBe("function");
    expect(delay).toBe(5 * 60 * 1000);
  });
});

