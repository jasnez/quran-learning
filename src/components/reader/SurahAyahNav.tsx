"use client";

import { useEffect, useState } from "react";
import type { Ayah } from "@/types/quran";
import { useBookmarkStore } from "@/store/bookmarkStore";

type Props = {
  ayahs: Ayah[];
  surahNumber: number;
};

function parseAyahId(id: string): { surahNumber: number; ayahNumber: number } {
  const [s, a] = id.split(":").map(Number);
  return { surahNumber: s ?? 1, ayahNumber: a ?? 1 };
}

export function SurahAyahNav({ ayahs, surahNumber }: Props) {
  const [activeAyahNumber, setActiveAyahNumber] = useState<number>(1);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  useEffect(() => {
    if (ayahs.length === 0) return;
    const elements = ayahs
      .map((a) => document.querySelector(`[data-ayah-id="${a.id}"]`))
      .filter((el): el is Element => el != null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const top = visible[0];
        if (!top) return;
        const id = top.target.getAttribute("data-ayah-id");
        if (!id) return;
        const ayahNum = parseInt(id.split(":")[1] ?? "1", 10);
        if (Number.isFinite(ayahNum)) setActiveAyahNumber(ayahNum);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ayahs]);

  const handleJump = (ayahId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector(`[data-ayah-id="${ayahId}"]`);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside
      className="hidden lg:block lg:w-44 lg:flex-shrink-0"
      aria-label="Lista ajeta"
    >
      <div className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Ajeti
        </p>
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
                  className={`flex items-center justify-between rounded-md px-3 py-1 text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                    isActive
                      ? "bg-emerald-100 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  }`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span>{ayahNumber}</span>
                  {isBookmarked && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-amber-500"
                      aria-label="Označen"
                    />
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
