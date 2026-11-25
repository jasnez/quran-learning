import { describe, it, expect } from "vitest";
import type { TajwidRule } from "@/types/quran";
import { getAllTajwidLessons } from "@/data/tajwid-lessons";
import {
  tajwidRuleClasses,
  tajwidRuleDescriptions,
  tajwidRuleLabels,
  tajwidRuleLessonSlugs,
  tajwidRuleLineClasses,
  tajwidRuleSentences,
  tajwidRuleNames,
} from "../tajwidStyles";

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

    it("colors each rule with its --tj-* token, the same class in every theme", () => {
      expect(tajwidRuleClasses).toEqual({
        normal: "text-foreground",
        mad: "text-tj-medd",
        ghunnah: "text-tj-gunne",
        ikhfa: "text-tj-ihfa",
        qalqalah: "text-tj-kalkala",
      });
    });
  });

  describe("tajwidRuleLineClasses", () => {
    it("draws a line style per rule, only under an ancestor with data-tajwid-lines", () => {
      expect(tajwidRuleLineClasses.normal).toBe("");
      const styles: [keyof typeof tajwidRuleLineClasses, string][] = [
        ["mad", "solid"],
        ["ghunnah", "dotted"],
        ["ikhfa", "dashed"],
        // Wavy is drawn as a letter-like hook (Chromium) or not at all (WebKit) under one letter.
        ["qalqalah", "double"],
      ];
      for (const [rule, style] of styles) {
        const classes = tajwidRuleLineClasses[rule].split(" ");
        expect(classes, rule).toContain(`[[data-tajwid-lines]_&]:underline`);
        expect(classes, rule).toContain(`[[data-tajwid-lines]_&]:decoration-${style}`);
        // The pattern classes act only under data-tajwid-lines too (their CSS in globals.css says so).
        const variant = classes.filter((c) => !c.startsWith("tj-line-"));
        expect(variant.every((c) => c.startsWith("[[data-tajwid-lines]_&]:")), rule).toBe(true);
      }
    });

    it("draws gunne dots and ihfa dashes as a pattern, which stays visible under one narrow letter", () => {
      // A dotted or dashed underline under one letter shrinks to a single dot or dash.
      expect(tajwidRuleLineClasses.ghunnah.split(" ")).toContain("tj-line-dots");
      expect(tajwidRuleLineClasses.ikhfa.split(" ")).toContain("tj-line-dashes");
      // Solid and double lines read well under one letter: they stay underlines.
      for (const rule of ["mad", "qalqalah"] as const) {
        expect(tajwidRuleLineClasses[rule], rule).not.toMatch(/\btj-line-/);
      }
    });
  });

  describe("tajwidRuleSentences (the rule bar)", () => {
    it("has the approved sentence for each colored rule", () => {
      expect(tajwidRuleSentences).toEqual({
        mad: "ovdje se glas uči duže od običnog dugog vokala.",
        ghunnah: "nun ili mim se ovdje uči kroz nos.",
        ikhfa: "nun bez vokala, tenvin ili mim se ovdje prikriva i uči kroz nos.",
        qalqalah: "harf bez vokala ovdje odskoči, da se jasno čuje.",
      });
    });
  });

  describe("tajwidRuleLessonSlugs", () => {
    it("links every colored rule to the lesson that teaches it", async () => {
      const lessons = await getAllTajwidLessons();
      const bySlug = new Map(lessons.map((l) => [l.slug, l.ruleType]));
      expect(Object.keys(tajwidRuleLessonSlugs).sort()).toEqual(["ghunnah", "ikhfa", "mad", "qalqalah"]);
      for (const [rule, slug] of Object.entries(tajwidRuleLessonSlugs)) {
        expect(bySlug.get(slug), slug).toBe(rule);
      }
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
      expect(tajwidRuleLabels.normal).toBe("Bez pravila");
      expect(tajwidRuleLabels.mad).toBe("Medd: glas se produžava");
      expect(tajwidRuleLabels.ghunnah).toBe("Gunne: izgovor kroz nos");
      expect(tajwidRuleLabels.ikhfa).toBe("Ihfa: prikriven izgovor kroz nos");
      expect(tajwidRuleLabels.qalqalah).toBe("Kalkala: odskok glasa");
    });
  });

  describe("tajwidRuleNames and tajwidRuleDescriptions", () => {
    it("name the rules Medd, Gunne, Ihfa and Kalkala with a short description each", () => {
      expect(tajwidRuleNames).toEqual({
        normal: "Bez pravila",
        mad: "Medd",
        ghunnah: "Gunne",
        ikhfa: "Ihfa",
        qalqalah: "Kalkala",
      });
      expect(tajwidRuleDescriptions).toEqual({
        normal: "",
        mad: "glas se produžava",
        ghunnah: "izgovor kroz nos",
        ikhfa: "prikriven izgovor kroz nos",
        qalqalah: "odskok glasa",
      });
    });
  });
});
