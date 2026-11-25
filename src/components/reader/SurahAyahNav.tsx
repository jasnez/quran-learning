"use client";

import type { Ayah } from "@/types/quran";
import { useBookmarkStore } from "@/store/bookmarkStore";
import { useReaderPositionStore } from "@/store/readerPositionStore";
import { IDLE_CLASSES, SELECTED_CLASSES } from "@/components/ui/selected";
import { preferredScrollBehavior } from "@/lib/scrollBehavior";

type Props = {
  ayahs: Ayah[];
  surahNumber: number;
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

export function SurahAyahNav({ ayahs, surahNumber }: Props) {
  // The ayah on screen: written by the reader's one observer (useActiveAyahObserver).
  const activeAyahNumber = useReaderPositionStore((s) => s.ayahNumber);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  const handleJump = (ayahId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector(`[data-ayah-id="${ayahId}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "start" });
    }
  };

  return (
    <aside
      className="hidden lg:block lg:sticky lg:top-[calc(var(--app-header-offset)+1rem)] lg:max-h-[calc(100vh-6rem)] lg:w-56 lg:flex-shrink-0 lg:overflow-y-auto lg:pr-2 lg:transition-[top] lg:duration-200"
      aria-label="Lista ajeta"
    >
      <div>
        <p className="px-3 pb-2 text-sm font-semibold text-ink-muted">Ajeti</p>
        <ul className="space-y-0.5">
          {ayahs.map((ayah) => {
            const { ayahNumber } = parseAyahId(ayah.id);
            const isActive = ayahNumber === activeAyahNumber;
            const isBookmarked = bookmarks.some(
              (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber,
            );
            return (
              <li key={ayah.id}>
                <a
                  href={`#ayah-${ayah.id.replace(":", "-")}`}
                  onClick={handleJump(ayah.id)}
                  className={`flex h-8 items-center justify-between rounded-lg border-[1.5px] px-3 text-sm tabular-nums transition-colors duration-press ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text ${
                    isActive ? `font-semibold ${SELECTED_CLASSES}` : IDLE_CLASSES
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span>{ayahNumber}</span>
                  {isBookmarked && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                      <span className="sr-only">, sačuvan</span>
                    </>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
