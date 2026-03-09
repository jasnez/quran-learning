import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ENV_KEY = "NEXT_PUBLIC_AUDIO_CDN_URL";

describe("buildAudioUrl", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[ENV_KEY];
  });

  afterEach(() => {
    process.env[ENV_KEY] = originalEnv;
    vi.resetModules();
  });

  it("returns empty string for null or undefined", async () => {
    process.env[ENV_KEY] = "https://cdn.example.com/audio";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl(null)).toBe("");
    expect(buildAudioUrl(undefined)).toBe("");
  });

  it("returns empty string for empty or whitespace", async () => {
    process.env[ENV_KEY] = "https://cdn.example.com/audio";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl("")).toBe("");
    expect(buildAudioUrl("   ")).toBe("");
  });

  it("returns absolute URL unchanged", async () => {
    process.env[ENV_KEY] = "https://cdn.example.com/audio";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    const url = "https://everyayah.com/data/Alafasy_128kbps/001001.mp3";
    expect(buildAudioUrl(url)).toBe(url);
    expect(buildAudioUrl("http://localhost/audio/1.mp3")).toBe("http://localhost/audio/1.mp3");
  });

  it("prepends CDN base URL when NEXT_PUBLIC_AUDIO_CDN_URL is set", async () => {
    process.env[ENV_KEY] = "https://xxx.supabase.co/storage/v1/object/public/audio";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl("/audio/mishary-alafasy/001001.mp3")).toBe(
      "https://xxx.supabase.co/storage/v1/object/public/audio/mishary-alafasy/001001.mp3"
    );
  });

  it("strips /audio/ prefix so path is reciter/file (no double audio)", async () => {
    process.env[ENV_KEY] = "https://cdn.example.com/audio";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl("/audio/mishary-alafasy/001001.mp3")).toBe(
      "https://cdn.example.com/audio/mishary-alafasy/001001.mp3"
    );
  });

  it("when CDN not set, returns relative path with leading slash", async () => {
    delete process.env[ENV_KEY];
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl("/audio/mishary-alafasy/001001.mp3")).toBe("/audio/mishary-alafasy/001001.mp3");
    expect(buildAudioUrl("audio/001001.mp3")).toBe("/audio/001001.mp3");
  });

  it("strips trailing slash from CDN base", async () => {
    process.env[ENV_KEY] = "https://cdn.example.com/audio/";
    vi.resetModules();
    const { buildAudioUrl } = await import("../reciterUtils");
    expect(buildAudioUrl("mishary-alafasy/001001.mp3")).toBe(
      "https://cdn.example.com/audio/mishary-alafasy/001001.mp3"
    );
  });
});
