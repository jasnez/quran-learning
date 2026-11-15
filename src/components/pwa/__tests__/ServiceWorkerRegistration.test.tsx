/**
 * @vitest-environment jsdom
 *
 * public/sw.js serves /_next/static cache-first. Production chunk names are hashed, but
 * `next dev` chunk names are not, so in development the SW would keep serving stale code.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { ServiceWorkerRegistration } from "../ServiceWorkerRegistration";

const register = vi.fn();
const unregister = vi.fn(() => Promise.resolve(true));
const getRegistrations = vi.fn(() => Promise.resolve([{ unregister }]));
const cacheKeys = vi.fn(() => Promise.resolve(["quran-shell-v1", "quran-static-v1", "quran-api-v1", "other-app"]));
const cacheDelete = vi.fn(() => Promise.resolve(true));

beforeEach(() => {
  vi.clearAllMocks();
  register.mockImplementation(() => Promise.resolve({}));
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register, getRegistrations },
  });
  Object.defineProperty(window, "caches", {
    configurable: true,
    value: { keys: cacheKeys, delete: cacheDelete },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ServiceWorkerRegistration", () => {
  it("registers /sw.js in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<ServiceWorkerRegistration />);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(getRegistrations).not.toHaveBeenCalled();
  });

  it("does not register in development and removes an earlier worker and its caches", async () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<ServiceWorkerRegistration />);
    expect(register).not.toHaveBeenCalled();
    await waitFor(() => expect(unregister).toHaveBeenCalled());
    await waitFor(() => expect(cacheDelete).toHaveBeenCalledTimes(3));
    expect(cacheDelete.mock.calls.map((c) => (c as unknown[])[0])).toEqual([
      "quran-shell-v1",
      "quran-static-v1",
      "quran-api-v1",
    ]);
  });

  it("logs a warning when registration fails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    register.mockImplementation(() => Promise.reject(new Error("blocked")));
    render(<ServiceWorkerRegistration />);
    await waitFor(() => expect(warn).toHaveBeenCalled());
  });
});
