/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toast } from "../Toast";
import { useToastStore } from "@/store/toastStore";

describe("Toast", () => {
  beforeEach(() => {
    useToastStore.setState({ message: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<Toast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders message when set in store", () => {
    useToastStore.setState({ message: "Test message" });
    const { container } = render(<Toast />);
    const toast = container.querySelector("[data-testid='toast']");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Test message");
  });

  it("auto-dismisses after 2 seconds", async () => {
    vi.useFakeTimers();
    useToastStore.setState({ message: "Will disappear" });
    const { container } = render(<Toast />);
    const toast = container.querySelector("[data-testid='toast']");
    expect(toast).toHaveTextContent("Will disappear");
    vi.advanceTimersByTime(2000);
    expect(useToastStore.getState().message).toBeNull();
  });
});
