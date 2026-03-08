import type { Ayah } from "@/types/quran";

type AyahLineProps = {
  ayah: Ayah;
  showTransliteration?: boolean;
};

export function AyahLine({ ayah, showTransliteration = true }: AyahLineProps) {
  return (
    <div className="border-b border-zinc-100 py-4 last:border-b-0 dark:border-zinc-800">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {ayah.ayahNumber}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="text-right text-2xl leading-loose text-zinc-900 dark:text-zinc-100"
            dir="rtl"
            lang="ar"
          >
            {ayah.arabicText}
          </p>
          {showTransliteration && ayah.transliteration && (
            <p className="mt-2 text-base italic leading-relaxed text-zinc-600 dark:text-zinc-400">
              {ayah.transliteration}
            </p>
          )}
          {ayah.translationBosnian && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
              {ayah.translationBosnian}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
