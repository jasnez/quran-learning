"use client";

import { useEffect } from "react";
import { useToastStore } from "@/store/toastStore";

const TOAST_DURATION_MS = 5000;

const VISIBLE_CLASSES =
  "fixed bottom-[calc(var(--bars-bottom)+1rem)] left-1/2 z-toast -translate-x-1/2 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-paper shadow-lg lg:bottom-auto lg:left-auto lg:right-6 lg:top-[calc(var(--bar-header)+1rem)] lg:translate-x-0";

export function Toast() {
  const message = useToastStore((s) => s.message);
  const showCount = useToastStore((s) => s.showCount);
  const clearToast = useToastStore((s) => s.clearToast);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => {
      clearToast();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [message, showCount, clearToast]);

  // The live region is always in the DOM; only its text changes, so screen readers announce it.
  return (
    <div
      data-testid="toast"
      role="status"
      aria-live="polite"
      className={message ? VISIBLE_CLASSES : "sr-only"}
    >
      {message}
    </div>
  );
}
