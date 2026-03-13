/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase browser client from @supabase/ssr
const signOutMock = vi.fn().mockResolvedValue({ error: null });
const updateUserMock = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      signOut: signOutMock,
      updateUser: updateUserMock,
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  })),
}));

// Import after mocks
import type { User } from "@supabase/supabase-js";
import {
  getCurrentUser,
  isAuthenticated,
  signOut,
  updatePassword,
  __setCurrentUserForTests,
} from "../authHelpers";

describe("authHelpers", () => {
  const fakeUser: Partial<User> = {
    id: "user-123",
    email: "test@example.com",
  };

  beforeEach(() => {
    __setCurrentUserForTests(null);
    signOutMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("returns null and false when no user is set", () => {
    expect(getCurrentUser()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("returns user and true when user is set", () => {
    __setCurrentUserForTests(fakeUser as User);
    expect(getCurrentUser()).toEqual(fakeUser);
    expect(isAuthenticated()).toBe(true);
  });

  it("signOut clears user and calls Supabase signOut", async () => {
    __setCurrentUserForTests(fakeUser as User);
    await signOut();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(getCurrentUser()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  describe("updatePassword", () => {
    beforeEach(() => {
      updateUserMock.mockClear();
      updateUserMock.mockResolvedValue({ data: { user: {} }, error: null });
    });

    it("calls Supabase auth.updateUser with the new password", async () => {
      const result = await updatePassword("newSecurePass123");
      expect(updateUserMock).toHaveBeenCalledTimes(1);
      expect(updateUserMock).toHaveBeenCalledWith({ password: "newSecurePass123" });
      expect(result.error).toBeNull();
    });

    it("returns error when Supabase updateUser fails", async () => {
      const err = new Error("Password should be at least 6 characters");
      updateUserMock.mockResolvedValueOnce({ data: { user: null }, error: err });
      const result = await updatePassword("short");
      expect(result.error).toBe(err);
    });
  });
});

