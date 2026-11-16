import { describe, it, expect } from "vitest";
import { metadata } from "../layout";

describe("Settings layout metadata", () => {
  it("has a Bosnian page title", () => {
    expect(metadata.title).toBe("Postavke | Quran Learning");
  });
});
