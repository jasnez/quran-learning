#!/usr/bin/env python3
"""Builds the app's two self-hosted Latin font families (SIL OFL 1.1) as woff2 subsets.

- "Elif Book" from Gentium Book Plus: transcription, translation and page titles.
- "Elif Sans" from Source Sans 3 (variable, weight axis limited to 400-700): everything else.

Why subsets of our own: Google's subsets split Bosnian letters (latin-ext) from ASCII (latin), and
none has U+0331 (combining macron below, the transcription's s with line below).

Regenerate (needs `python -m pip install --user fonttools brotli`):
  1. Download into a clean directory, from https://github.com/google/fonts/tree/main/ofl:
     gentiumbookplus/GentiumBookPlus-Regular.ttf, GentiumBookPlus-Bold.ttf and OFL.txt (save it as
     OFL-Gentium.txt); sourcesans3/SourceSans3[wght].ttf and OFL.txt (save it as OFL-SourceSans.txt).
  2. python -I scripts/subset-fonts.py <ttf-dir> src/app/fonts
  (-I: the font files are untrusted data, so Python must not load code from its surroundings.)

Output: <out-dir>/ElifBook-{Regular,Bold}.woff2, ElifSans.woff2, OFL-Gentium.txt,
OFL-SourceSans.txt and font-coverage.json ({ "files": { name: { "sha256", "codepoints" } } }, read
back from each subset's cmap; src/app/__tests__/fonts.test.ts checks it).

Kept characters: ASCII and every Latin-range code point (U+0020-024F, U+0250-02FF,
U+0300-036F, U+1E00-1EFF, U+2000-206F) found anywhere in src/**/*.{ts,tsx,json} (comments
included: a harmless superset). Elif Book keeps all layout features so that mark positioning for
U+0331 survives; Elif Sans keeps fontTools' default features.

Licence: Gentium Book Plus reserves the names "Gentium" and "SIL", Source Sans 3 reserves
"Source". A subset is a Modified Version, so the families are renamed inside the fonts, and the
files and the app's CSS names (src/app/layout.tsx, globals.css) use the new names. The copyright
notices stay, and both OFL texts are copied next to the fonts.
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
from fontTools.varLib import instancer  # noqa: E402

LATIN_RANGES = [
    (0x0020, 0x024F),
    (0x0250, 0x02FF),
    (0x0300, 0x036F),
    (0x1E00, 0x1EFF),
    (0x2000, 0x206F),
]

# (source file, family, style, output file, keep all layout features, weight axis limits)
BUILDS = [
    ("GentiumBookPlus-Regular.ttf", "Elif Book", "Regular", "ElifBook-Regular.woff2", True, None),
    ("GentiumBookPlus-Bold.ttf", "Elif Book", "Bold", "ElifBook-Bold.woff2", True, None),
    ("SourceSans3[wght].ttf", "Elif Sans", "Regular", "ElifSans.woff2", False, (400, 700)),
]
LICENCES = ["OFL-Gentium.txt", "OFL-SourceSans.txt"]

ROOT = Path(__file__).resolve().parent.parent


def in_latin_ranges(cp: int) -> bool:
    return any(lo <= cp <= hi for lo, hi in LATIN_RANGES)


def collect_codepoints() -> set:
    cps = set(range(0x20, 0x7F))
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


def rename(font: TTFont, family: str, style: str) -> None:
    name = font["name"]
    full = f"{family} {style}"
    ps = f"{family.replace(' ', '')}-{style}"
    for rec in list(name.names):
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID == 2:
            rec.string = style
        elif rec.nameID == 3:
            rec.string = f"{ps}-subset"
        elif rec.nameID == 4:
            rec.string = full
        elif rec.nameID == 6:
            rec.string = ps
        elif rec.nameID in (17, 21, 22, 25):
            name.names.remove(rec)
    # A variable font's named instances and axis names live in name IDs >= 256; they carry the
    # original family name in some records, so drop every name record that still mentions it.
    for rec in list(name.names):
        text = rec.toUnicode()
        if any(reserved in text for reserved in ("Gentium", "Source Sans", "SourceSans")):
            if rec.nameID == 0:
                continue  # the copyright notice must stay
            name.names.remove(rec)


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: subset-fonts.py <ttf-dir> <out-dir>")
    ttf_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    cps = collect_codepoints()

    coverage = {"files": {}}
    for ttf, family, style, out_name, all_features, wght in BUILDS:
        src = ttf_dir / ttf
        if not src.is_file():
            sys.exit(f"missing {src}")
        font = TTFont(str(src))

        options = subset.Options()
        options.flavor = "woff2"
        if all_features:
            options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        options.glyph_names = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=sorted(cps))
        subsetter.subset(font)
        if wght is not None:
            # Limit the weight axis after subsetting (fewer glyphs to instance). The named
            # instances go too: the app picks weights through CSS, not by instance name.
            font = instancer.instantiateVariableFont(font, {"wght": wght})
            font["fvar"].instances = []
        rename(font, family, style)

        out_path = out_dir / out_name
        font.flavor = "woff2"
        font.save(str(out_path))

        written = TTFont(str(out_path))
        have = sorted(written.getBestCmap().keys())
        if family == "Elif Book" and 0x0331 not in have:
            sys.exit(f"{out_name}: U+0331 is missing from the subset")
        missing = sorted(cps - set(have))
        coverage["files"][out_name] = {
            "sha256": hashlib.sha256(out_path.read_bytes()).hexdigest(),
            "codepoints": have,
        }
        print(
            f"{out_name}: {out_path.stat().st_size} bytes, {len(have)} code points, "
            f"{len(written.getGlyphOrder())} glyphs, {len(missing)} wanted but not in the source font"
        )

    (out_dir / "font-coverage.json").write_text(
        json.dumps(coverage, indent=1) + "\n", encoding="utf-8", newline="\n"
    )
    for licence in LICENCES:
        src = ttf_dir / licence
        if not src.is_file():
            sys.exit(f"missing {src}")
        shutil.copyfile(src, out_dir / licence)


if __name__ == "__main__":
    main()
