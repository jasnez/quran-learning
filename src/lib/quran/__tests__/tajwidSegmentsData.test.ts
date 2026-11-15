import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Guards the generated tajwid data in src/data/ayahs. A rule color must always
 * land on a letter: a colored segment made only of harakat or tatweel means the
 * annotation indices were applied to the wrong text (see scripts/generate-ayahs-json.ts).
 */
type Segment = { text: string; rule: string };
type AyahJson = { id: string; arabicText: string; tajwidSegments: Segment[] };

const AYAHS_DIR = path.join(process.cwd(), "src", "data", "ayahs");
const HARAKAT_OR_TATWEEL_ONLY = /^[\u064B-\u0652\u0640\s]+$/u;

function loadAyahs(): AyahJson[] {
  return fs
    .readdirSync(AYAHS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => (JSON.parse(fs.readFileSync(path.join(AYAHS_DIR, f), "utf-8")) as { ayahs: AyahJson[] }).ayahs);
}

const ayahs = loadAyahs();
const byId = new Map(ayahs.map((a) => [a.id, a]));
const colored = (id: string) => byId.get(id)!.tajwidSegments.filter((s) => s.rule !== "normal");

describe("tajwid segments in src/data/ayahs", () => {
  it("covers every ayah of the Quran", () => {
    expect(ayahs).toHaveLength(6236);
  });

  it("never colors a segment that contains no letter (only harakat or tatweel)", () => {
    const offenders = ayahs.flatMap((a) =>
      a.tajwidSegments
        .filter((s) => s.rule !== "normal" && HARAKAT_OR_TATWEEL_ONLY.test(s.text))
        .map((s) => `${a.id} ${s.rule} ${JSON.stringify(s.text)}`)
    );
    expect(offenders.slice(0, 5)).toEqual([]);
    expect(offenders).toHaveLength(0);
  });

  it("segments reconstruct the arabic text of every ayah", () => {
    const broken = ayahs.filter((a) => a.tajwidSegments.map((s) => s.text).join("") !== a.arabicText).map((a) => a.id);
    expect(broken).toEqual([]);
  });

  it("colors the madd of Ar-Rahman (superscript alef) and Ar-Rahim (ya at the stop) in 1:1", () => {
    expect(colored("1:1")).toEqual([
      { text: "\u0640\u0670", rule: "mad" },
      { text: "\u064A", rule: "mad" },
    ]);
  });

  it("colors shafawi and ghunnah idgham, the munfasil madd and the noon mushaddad of an-nar in 2:201", () => {
    expect(colored("2:201")).toEqual([
      { text: "\u0645 \u0645\u0651\u064E\u0646 \u064A\u064E", rule: "ghunnah" },
      { text: "\u0627\u0653", rule: "mad" },
      { text: "\u064B \u0648\u064E", rule: "ghunnah" },
      { text: "\u064B \u0648\u064E", rule: "ghunnah" },
      { text: "\u0646\u0651\u064E", rule: "ghunnah" },
      { text: "\u0627", rule: "mad" },
    ]);
  });
});
