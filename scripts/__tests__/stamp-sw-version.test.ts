import { describe, it, expect } from "vitest";
import { stampServiceWorker } from "../stamp-sw-version";

describe("stampServiceWorker", () => {
  it("replaces the version placeholder with the build id", () => {
    const source = 'const SW_VERSION = "__SW_VERSION__";\nconst X = 1;';
    expect(stampServiceWorker(source, "abc123")).toBe('const SW_VERSION = "abc123";\nconst X = 1;');
  });

  it("fails when the placeholder is missing, so a deploy cannot ship an unversioned worker", () => {
    expect(() => stampServiceWorker('const SW_VERSION = "old";', "abc123")).toThrow(/__SW_VERSION__/);
  });

  it("fails on an empty or unsafe build id", () => {
    expect(() => stampServiceWorker('"__SW_VERSION__"', "")).toThrow();
    expect(() => stampServiceWorker('"__SW_VERSION__"', 'a"; evil()')).toThrow();
  });
});
