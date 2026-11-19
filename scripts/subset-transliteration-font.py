#!/usr/bin/env python3
"""Builds the self-hosted transcription font (a subset of Gentium Book Plus, SIL OFL 1.1).

Why: the UI font Geist lacks most letters of the IZ BiH "specijal" transcription, and no
Google Fonts subset contains U+0331 (combining macron below), so the full TTF is subset here.

Regenerate (needs `python -m pip install --user fonttools`, plus `brotli` for woff2):
  1. Download GentiumBookPlus-Regular.ttf and GentiumBookPlus-Italic.ttf from
     https://github.com/google/fonts/tree/main/ofl/gentiumbookplus into a clean directory.
  2. python -I scripts/subset-transliteration-font.py <ttf-dir> src/app/fonts
  (-I: the font files are untrusted data, so Python must not load code from its surroundings.)

Output: <out-dir>/TranscriptionBook-{Regular,Italic}.woff2 and transcription-font-coverage.json
({ "files": { name: { "sha256", "codepoints" } } }, read back from each subset's cmap).

Kept characters: ASCII, Latin-1, and every Latin-range code point (U+0020-024F, U+0250-02FF,
U+0300-036F, U+1E00-1EFF, U+2000-206F) found anywhere in src/**/*.{ts,tsx,json} (comments included: a harmless superset).
All layout features stay so that mark positioning for U+0331 survives.

Licence: the OFL reserves the names "Gentium" and "SIL". A subset is a Modified Version, so
the family is renamed inside the font (FAMILY below), and the output files and the app's CSS
names (src/app/layout.tsx, globals.css) say "Transcription" as well. The copyright notice
stays, and the OFL.txt is copied next to the fonts.
"""
import hashlib
import json
import shutil
import site
import sys
from pathlib import Path

# -I ignores the per-user site directory; fontTools is installed there with --user.
sys.path.append(site.getusersitepackages())

from fontTools import subset  # noqa: E402
from fontTools.ttLib import TTFont  # noqa: E402

FAMILY = "Transcription Book"
LATIN_RANGES = [
    (0x0020, 0x024F),
    (0x0250, 0x02FF),
    (0x0300, 0x036F),
    (0x1E00, 0x1EFF),
    (0x2000, 0x206F),
]
FILES = {
    "Regular": "GentiumBookPlus-Regular.ttf",
    "Italic": "GentiumBookPlus-Italic.ttf",
}

ROOT = Path(__file__).resolve().parent.parent


def in_latin_ranges(cp: int) -> bool:
    return any(lo <= cp <= hi for lo, hi in LATIN_RANGES)


def collect_codepoints() -> set:
    cps = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
    count = 0
    for ext in ("ts", "tsx", "json"):
        for path in (ROOT / "src").rglob(f"*.{ext}"):
            count += 1
            for ch in path.read_text(encoding="utf-8"):
                cp = ord(ch)
                if in_latin_ranges(cp):
                    cps.add(cp)
    if count == 0:
        sys.exit("No source files found under src/; run from the repository.")
    return cps


def rename(font: TTFont, style: str) -> None:
    name = font["name"]
    full = f"{FAMILY} {style}"
    ps = f"{FAMILY.replace(' ', '')}-{style}"
    for rec in list(name.names):
        if rec.nameID in (1, 16):
            rec.string = FAMILY
        elif rec.nameID == 3:
            rec.string = f"{ps}-subset"
        elif rec.nameID == 4:
            rec.string = full
        elif rec.nameID == 6:
            rec.string = ps
        elif rec.nameID in (21, 22):
            name.names.remove(rec)


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: subset-transliteration-font.py <ttf-dir> <out-dir>")
    ttf_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    cps = collect_codepoints()

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.glyph_names = False

    coverage = {"files": {}}
    for style, ttf in FILES.items():
        src = ttf_dir / ttf
        if not src.is_file():
            sys.exit(f"missing {src}")
        font = TTFont(str(src))
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=sorted(cps))
        subsetter.subset(font)
        rename(font, style)
        out_name = f"TranscriptionBook-{style}.woff2"
        out_path = out_dir / out_name
        font.flavor = "woff2"
        font.save(str(out_path))

        written = TTFont(str(out_path))
        have = sorted(written.getBestCmap().keys())
        if 0x0331 not in have:
            sys.exit(f"{out_name}: U+0331 is missing from the subset")
        coverage["files"][out_name] = {
            "sha256": hashlib.sha256(out_path.read_bytes()).hexdigest(),
            "codepoints": have,
        }
        print(f"{out_name}: {out_path.stat().st_size} bytes, {len(have)} code points, {len(written.getGlyphOrder())} glyphs")

    (out_dir / "transcription-font-coverage.json").write_text(
        json.dumps(coverage, indent=1) + "\n", encoding="utf-8", newline="\n"
    )
    ofl = ttf_dir / "OFL.txt"
    if ofl.is_file():
        shutil.copyfile(ofl, out_dir / "OFL.txt")


if __name__ == "__main__":
    main()
