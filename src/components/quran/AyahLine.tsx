import type { Ayah } from "@/types/quran";
import { stripWaqfSigns } from "@/lib/quran/stripWaqfSigns";

type AyahLineProps = {
  ayah: Ayah;
  showTransliteration?: boolean;
};

export function AyahLine({ ayah, showTransliteration = true }: AyahLineProps) {
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-medium text-ink-muted">
          {ayah.ayahNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-right text-2xl leading-loose text-ink"
            dir="rtl"
            lang="ar"
          >
            {stripWaqfSigns(ayah.arabicText)}
          </p>
          {showTransliteration && ayah.transliteration && (
            <p className="mt-2 font-transliteration text-base italic leading-relaxed text-ink-muted">
              {ayah.transliteration}
            </p>
          )}
          {ayah.translationBosnian && (
            <p className="mt-1 text-sm text-ink-muted">
              {ayah.translationBosnian}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
