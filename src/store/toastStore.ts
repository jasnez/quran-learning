import { create } from "zustand";

type ToastState = {
  message: string | null;
  /** Grows with every showToast, so the same message shown again restarts the timer. */
  showCount: number;
  showToast: (message: string) => void;
  clearToast: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  showCount: 0,
  showToast: (message) => set((s) => ({ message, showCount: s.showCount + 1 })),
  clearToast: () => set({ message: null }),
}));
