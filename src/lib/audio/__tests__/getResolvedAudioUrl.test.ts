import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getResolvedAudioUrl } from "../getResolvedAudioUrl";

const ENV_KEY = "NEXT_PUBLIC_AUDIO_CDN_URL";
const PROXY_ENV_KEY = "NEXT_PUBLIC_AUDIO_VIA_PROXY";

describe("getResolvedAudioUrl", () => {
  let originalEnv: string | undefined;
  let originalProxy: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[ENV_KEY];
    originalProxy = process.env[PROXY_ENV_KEY];
  });

  afterEach(() => {
    process.env[ENV_KEY] = originalEnv;
    process.env[PROXY_ENV_KEY] = originalProxy;
    vi.resetModules();
  });

  it("returns null for null or undefined", () => {
    expect(getResolvedAudioUrl(null)).toBeNull();
    expect(getResolvedAudioUrl(undefined)).toBeNull();
  });

  it("returns null for empty or whitespace", () => {
    expect(getResolvedAudioUrl("")).toBeNull();
    expect(getResolvedAudioUrl("   ")).toBeNull();
  });

  it("returns absolute URL unchanged", () => {
    const cdn =
      "https://xxx.supabase.co/storage/v1/object/public/audio/mishary-alafasy/001001.mp3";
    expect(getResolvedAudioUrl(cdn)).toBe(cdn);
    expect(getResolvedAudioUrl("https://everyayah.com/data/x/001001.mp3")).toBe(
      "https://everyayah.com/data/x/001001.mp3"
    );
  });

  it("when CDN env is set, resolves relative /audio/reciter/file to CDN URL", async () => {
    process.env[ENV_KEY] = "https://xxx.supabase.co/storage/v1/object/public/audio";
    vi.resetModules();
    const { getResolvedAudioUrl: resolve } = await import("../getResolvedAudioUrl");
    expect(resolve("/audio/mishary-alafasy/001001.mp3")).toBe(
      "https://xxx.supabase.co/storage/v1/object/public/audio/mishary-alafasy/001001.mp3"
    );
  });

  it("when CDN env is not set, resolves relative /audio/reciter/SSSXXX.mp3 to everyayah fallback", async () => {
    delete process.env[ENV_KEY];
    vi.resetModules();
    const { getResolvedAudioUrl: resolve } = await import("../getResolvedAudioUrl");
    expect(resolve("/audio/mishary-alafasy/001001.mp3")).toBe(
      "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
    );
  });

  it("when NEXT_PUBLIC_AUDIO_VIA_PROXY=1, returns proxy URL not everyayah (so proxy is used for playback)", async () => {
    delete process.env[ENV_KEY];
    process.env.NEXT_PUBLIC_AUDIO_VIA_PROXY = "1";
    vi.resetModules();
    const { getResolvedAudioUrl: resolve } = await import("../getResolvedAudioUrl");
    const result = resolve("/audio/mishary-alafasy/001001.mp3");
    expect(result).toMatch(/^\/api\/audio\?path=/);
    expect(result).not.toContain("everyayah.com");
  });
});
