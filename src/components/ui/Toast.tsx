"use client";

import { useEffect } from "react";
import { useToastStore } from "@/store/toastStore";

const TOAST_DURATION_MS = 2000;

export function Toast() {
  const message = useToastStore((s) => s.message);
  const clearToast = useToastStore((s) => s.clearToast);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => {
      clearToast();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [message, clearToast]);

  if (!message) return null;

  return (
    <div
      data-testid="toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-stone-800 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-stone-700 md:bottom-8"
    >
      {message}
    </div>
  );
}

