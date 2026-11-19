/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineIndicator } from "../OfflineIndicator";

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, value });
}

describe("OfflineIndicator", () => {
  afterEach(() => setOnline(true));

  it("renders an empty status region while online, then fills the same node when offline", () => {
    setOnline(true);
    render(<OfflineIndicator />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Nema interneta: dostupne su preuzete sure.");

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(status).toBeEmptyDOMElement();
  });
});
