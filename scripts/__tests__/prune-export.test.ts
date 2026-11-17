import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { minifyJsonFiles, removeFullSegmentCopies } from "../prune-export";

let out: string;

function write(rel: string, content: string) {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const exists = (rel: string) => fs.existsSync(path.join(out, rel));
const read = (rel: string) => fs.readFileSync(path.join(out, rel), "utf8");

beforeEach(() => {
  out = fs.mkdtempSync(path.join(os.tmpdir(), "prune-export-"));
});

afterEach(() => {
  fs.rmSync(out, { recursive: true, force: true });
});

describe("removeFullSegmentCopies", () => {
  beforeEach(() => {
    write("index.txt", "root payload");
    write("__next._full.txt", "root payload");
    write("__next._tree.txt", "root tree");
    write("surah/2.txt", "surah payload");
    write("surah/2/__next._full.txt", "surah payload");
    write("surah/2/__next._tree.txt", "surah tree");
    write("surah/2/__next.surah.$d$surahId.__PAGE__.txt", "surah page segment");
    write("_next/static/chunks/app.js", 'function f(e){return`__next${e}.txt`}');
  });

  it("removes each __next._full.txt that is a copy of its route payload and keeps the files the client requests", () => {
    const result = removeFullSegmentCopies(out);

    expect(result.files).toBe(2);
    expect(result.bytes).toBe("root payload".length + "surah payload".length);
    expect(exists("__next._full.txt")).toBe(false);
    expect(exists("surah/2/__next._full.txt")).toBe(false);
    expect(read("index.txt")).toBe("root payload");
    expect(read("surah/2.txt")).toBe("surah payload");
    expect(exists("surah/2/__next._tree.txt")).toBe(true);
    expect(exists("surah/2/__next.surah.$d$surahId.__PAGE__.txt")).toBe(true);
  });

  it("deletes nothing and fails when a copy differs from its route payload", () => {
    write("surah/2/__next._full.txt", "something else");

    expect(() => removeFullSegmentCopies(out)).toThrow(/surah[\\/]2[\\/]__next\._full\.txt/);
    expect(exists("__next._full.txt")).toBe(true);
    expect(exists("surah/2/__next._full.txt")).toBe(true);
  });

  it("deletes nothing and fails when the route payload is missing", () => {
    fs.rmSync(path.join(out, "surah/2.txt"));

    expect(() => removeFullSegmentCopies(out)).toThrow(/surah[\\/]2\.txt/);
    expect(exists("__next._full.txt")).toBe(true);
  });

  it("deletes nothing and fails when client code mentions _full, so a Next upgrade that requests it cannot break navigation", () => {
    write("_next/static/chunks/router.js", 'const p="/_full";');

    expect(() => removeFullSegmentCopies(out)).toThrow(/router\.js/);
    expect(exists("__next._full.txt")).toBe(true);
    expect(exists("surah/2/__next._full.txt")).toBe(true);
  });

  it("reports zero when the export has no copies", () => {
    fs.rmSync(path.join(out, "__next._full.txt"));
    fs.rmSync(path.join(out, "surah/2/__next._full.txt"));

    expect(removeFullSegmentCopies(out)).toEqual({ files: 0, bytes: 0 });
  });
});

describe("minifyJsonFiles", () => {
  it("rewrites pretty-printed JSON without whitespace and keeps the data", () => {
    const words = [{ textArabic: "بِسْمِ", startTimeMs: 0, endTimeMs: 580, note: "a  b" }];
    write("data/words/001-al-fatiha.json", JSON.stringify(words, null, 2) + "\n");
    write("data/search-index.json", JSON.stringify({ a: 1 }));

    const result = minifyJsonFiles(path.join(out, "data"));

    expect(read("data/words/001-al-fatiha.json")).toBe(JSON.stringify(words));
    expect(read("data/search-index.json")).toBe('{"a":1}');
    expect(result.files).toBe(2);
    expect(result.after).toBeLessThan(result.before);
    expect(result.after).toBe(
      Buffer.byteLength(JSON.stringify(words)) + Buffer.byteLength('{"a":1}'),
    );
  });

  it("fails on invalid JSON and names the file", () => {
    write("data/chapter-audio/002-al-baqarah.json", "{ not json");

    expect(() => minifyJsonFiles(path.join(out, "data"))).toThrow(/002-al-baqarah\.json/);
  });

  it("fails when the folder has no JSON files, since the app reads its data from there", () => {
    fs.mkdirSync(path.join(out, "data"));

    expect(() => minifyJsonFiles(path.join(out, "data"))).toThrow(/no JSON/);
  });
});
