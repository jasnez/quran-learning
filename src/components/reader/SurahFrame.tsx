"use client";

import type { SurahSummary, Ayah } from "@/types/quran";
import { commonSurahName } from "@/lib/quran/surahNames";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { AYAH_FORMS, formatCount, formatNumber } from "@/lib/format";
import { ayahsDoneCount } from "@/lib/progress/ayahsDone";
import * as audioManager from "@/lib/audio/audioManager";
import { Button, ButtonLink } from "@/components/ui";
import { PlayIcon } from "@/components/ui/icons";

const revelationLabel: Record<string, string> = {
  meccan: "mekanska sura",
  medinan: "medinska sura",
};

type SurahFrameProps = {
  surah: SurahSummary;
  ayahs?: Ayah[];
  /** "page": the title of a surah page (h1, actions, progress). "segment": a surah inside a juz. */
  variant?: "page" | "segment";
};

/** The frame itself: a gold border with a gold outline, as around a surah title in a mushaf. */
const FRAME =
  "m-1 rounded-control border border-gold px-4 pb-3 pt-2.5 text-center outline-1 outline-offset-[3px] outline-gold md:px-5";

function pagePhrase(ayahs: Ayah[]): string | null {
  const pages = ayahs.map((a) => a.page).filter((p) => typeof p === "number" && p > 0);
  if (pages.length === 0) return null;
  const min = Math.min(...pages);
  const max = Math.max(...pages);
  return min === max ? `str. ${min}` : `str. ${min}–${max}`;
}

/**
 * The title frame of a surah (unvan): both names, one line about the surah, and under the frame
 * the two things to do with it. Nothing here leaves for another surah (that is at the end of the
 * surah), and progress is one line of text, not a bar.
 */
export function SurahFrame({ surah, ayahs = [], variant = "page" }: SurahFrameProps) {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const play = usePlayerStore((s) => s.play);
  // Read and heard ayahs count together (lib/progress/ayahsDone).
  const done = useProgressStore((s) => ayahsDoneCount(s.surahProgressMap[surah.surahNumber]));

  const common = commonSurahName(surah);
  const names = (
    <>
      <span lang="ar" dir="rtl" className={variant === "page" ? "font-arabic text-4xl leading-[1.5] md:text-5xl md:leading-[1.5]" : "font-arabic text-2xl leading-[1.5]"}>
        {surah.nameArabic}
      </span>
      <span className="text-[1.0625rem] font-semibold leading-snug">
        {surah.nameLatin}
        {common && <span className="font-normal text-ink-muted"> {common}</span>}
      </span>
    </>
  );

  if (variant === "segment") {
    return (
      <div data-surah-frame className={FRAME}>
        <h2 className="flex flex-col gap-0.5 font-normal text-ink">{names}</h2>
      </div>
    );
  }

  const totalAyahs = ayahs.length > 0 ? ayahs.length : surah.ayahCount;
  const meta = [
    formatCount(surah.ayahCount, AYAH_FORMS),
    revelationLabel[surah.revelationType] ?? surah.revelationType,
    pagePhrase(ayahs),
  ]
    .filter(Boolean)
    .join(", ");

  const handlePlayFullSurah = () => {
    if (ayahs.length === 0) return;
    // Prime audio playback on direct user gesture (mobile autoplay policies)
    const playResult = audioManager.play();
    if (playResult && typeof (playResult as Promise<void>).catch === "function") {
      void (playResult as Promise<void>).catch(() => {
        // ignore – actual source will be loaded via AudioPlayer effect
      });
    }
    setQueue(ayahs);
    play(ayahs[0]);
  };

  return (
    <header>
      <div data-surah-frame className={FRAME}>
        <h1 className="flex flex-col gap-0.5 font-normal text-ink">{names}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{meta}</p>
      </div>
      {ayahs.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button onClick={handlePlayFullSurah} leadingIcon={<PlayIcon className="h-[1.125rem] w-[1.125rem]" />}>
            Pusti suru
          </Button>
          {/* No prefetch: it would download a second copy of the surah on every visit (QA section 6). */}
          <ButtonLink href={`/learn/${surah.surahNumber}`} variant="secondary" prefetch={false}>
            Uči ajet po ajet
          </ButtonLink>
        </div>
      )}
      {done > 0 && (
        <p className="mt-3 text-center text-sm text-ink-muted">
          Pročitano: {formatNumber(done)} od {formatNumber(totalAyahs)} ajeta
        </p>
      )}
    </header>
  );
}
