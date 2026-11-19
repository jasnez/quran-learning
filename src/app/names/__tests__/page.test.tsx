/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import NamesPage, { metadata } from "../page";

vi.mock("@/components/names/NamesPageContent", () => ({ NamesPageContent: () => null }));

afterEach(cleanup);

describe("Allahova lijepa imena page", () => {
  it("describes the 99 names the same way in the description and the intro", () => {
    const { container } = render(<NamesPage />);
    const tail = ": 99 Allahovih lijepih imena s arapskim tekstom, transliteracijom i prijevodom";
    expect(container.querySelector("h1 + p")?.textContent?.endsWith(tail)).toBe(true);
    expect(metadata.description).toContain(tail);
    expect(metadata.description).not.toContain("na bosanski");
  });
});
