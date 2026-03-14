import { describe, it, expect } from "vitest";
import { categoryFromSlug, isValidCategorySlug } from "../categoryFromSlug";

describe("categoryFromSlug", () => {
  it("returns category for valid slugs", () => {
    expect(categoryFromSlug("rabbana")).toBe("rabbana");
    expect(categoryFromSlug("forgiveness")).toBe("forgiveness");
    expect(categoryFromSlug("knowledge")).toBe("knowledge");
    expect(categoryFromSlug("guidance")).toBe("guidance");
    expect(categoryFromSlug("patience")).toBe("patience");
    expect(categoryFromSlug("family")).toBe("family");
  });

  it("returns undefined for invalid slug", () => {
    expect(categoryFromSlug("invalid")).toBeUndefined();
    expect(categoryFromSlug("")).toBeUndefined();
    expect(categoryFromSlug("RABBANA")).toBeUndefined();
  });
});

describe("isValidCategorySlug", () => {
  it("returns true for valid category slugs", () => {
    expect(isValidCategorySlug("rabbana")).toBe(true);
    expect(isValidCategorySlug("forgiveness")).toBe(true);
  });

  it("returns false for invalid slugs", () => {
    expect(isValidCategorySlug("x")).toBe(false);
    expect(isValidCategorySlug("")).toBe(false);
  });
});
