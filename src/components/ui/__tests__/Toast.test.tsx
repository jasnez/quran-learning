/**
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { Toast } from "../Toast";
import { useToastStore } from "@/store/toastStore";

describe("Toast", () => {
  beforeEach(() => {
    useToastStore.setState({ message: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("always renders an empty status region when there is no message", () => {
    render(<Toast />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(status).not.toHaveClass("bg-stone-800");
  });

  it("puts the message into the same region node", () => {
    const { rerender } = render(<Toast />);
    const before = screen.getByRole("status");
    act(() => {
      useToastStore.setState({ message: "12. ajet je sačuvan." });
    });
    rerender(<Toast />);
    const after = screen.getByRole("status");
    expect(after).toBe(before);
    expect(after).toHaveTextContent("12. ajet je sačuvan.");
    expect(after).toHaveClass("bg-stone-800");
  });

  it("renders message when set in store", () => {
    useToastStore.setState({ message: "Test message" });
    const { container } = render(<Toast />);
    const toast = container.querySelector("[data-testid='toast']");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Test message");
  });

  it("clears the text after 5 seconds, not after 2", () => {
    vi.useFakeTimers();
    useToastStore.setState({ message: "Will disappear" });
    render(<Toast />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Will disappear");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(status).toHaveTextContent("Will disappear");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(useToastStore.getState().message).toBeNull();
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });
});
