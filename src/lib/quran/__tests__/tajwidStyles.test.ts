import { describe, it, expect } from "vitest";
import type { TajwidRule } from "@/types/quran";
import { tajwidRuleClasses, tajwidRuleLabels } from "../tajwidStyles";

const ALL_TAJWID_RULES: TajwidRule[] = ["normal", "mad", "ghunnah", "ikhfa", "qalqalah"];

describe("tajwidStyles", () => {
  describe("tajwidRuleClasses", () => {
    it("has an entry for every TajwidRule", () => {
      for (const rule of ALL_TAJWID_RULES) {
        expect(tajwidRuleClasses[rule]).toBeDefined();
        expect(typeof tajwidRuleClasses[rule]).toBe("string");
      }
      expect(Object.keys(tajwidRuleClasses).sort()).toEqual([...ALL_TAJWID_RULES].sort());
    });

    it("uses the single source of truth colors (no random/hardcoded elsewhere)", () => {
      expect(tajwidRuleClasses.normal).toBe("text-foreground");
      expect(tajwidRuleClasses.mad).toBe("text-emerald-600 dark:text-emerald-400");
      expect(tajwidRuleClasses.ghunnah).toBe("text-rose-600 dark:text-rose-400");
      expect(tajwidRuleClasses.ikhfa).toBe("text-sky-600 dark:text-sky-400");
      expect(tajwidRuleClasses.qalqalah).toBe("text-amber-600 dark:text-amber-400");
    });
  });

  describe("tajwidRuleLabels", () => {
    it("has an entry for every TajwidRule", () => {
      for (const rule of ALL_TAJWID_RULES) {
        expect(tajwidRuleLabels[rule]).toBeDefined();
        expect(typeof tajwidRuleLabels[rule]).toBe("string");
      }
      expect(Object.keys(tajwidRuleLabels).sort()).toEqual([...ALL_TAJWID_RULES].sort());
    });

    it("provides Bosnian descriptions for each rule", () => {
      expect(tajwidRuleLabels.normal).toBe("Normalan tekst");
      expect(tajwidRuleLabels.mad).toBe("Duljenje (Mad) — produziti glas");
      expect(tajwidRuleLabels.ghunnah).toBe("Ghunnah — nazalni zvuk");
      expect(tajwidRuleLabels.ikhfa).toBe("Ikhfa — skriveni nazalni zvuk");
      expect(tajwidRuleLabels.qalqalah).toBe("Qalqalah — odskok zvuka");
    });
  });
});
