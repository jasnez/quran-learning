import { create } from "zustand";
import type { ColoredTajwidRule } from "@/lib/quran/tajwidStyles";

type TajwidRuleBarState = {
  /** The rule shown in the bar, or null when the bar is closed. Not persisted. */
  rule: ColoredTajwidRule | null;
  open: (rule: ColoredTajwidRule) => void;
  close: () => void;
};

/** The bar that names the tajwid rule of a tapped colored letter (TajwidRuleBar). */
export const useTajwidRuleBarStore = create<TajwidRuleBarState>((set) => ({
  rule: null,
  open: (rule) => set({ rule }),
  close: () => set({ rule: null }),
}));
