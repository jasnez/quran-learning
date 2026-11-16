import { describe, it, expect } from "vitest";
import { metadata } from "../layout";

describe("Search layout metadata", () => {
  it("has a Bosnian page title", () => {
    expect(metadata.title).toBe("Pretraga | Quran Learning");
  });
});
