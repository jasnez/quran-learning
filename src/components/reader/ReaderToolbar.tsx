"use client";

import { useContext } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlayerStore } from "@/store/playerStore";
import { SettingsOpenContext } from "@/contexts/SettingsOpenContext";

const FONT_MIN = 20;
const FONT_MAX = 44;
const FONT_STEP = 4;

const ICON_BTN =
  "flex h-9 items-center justify-center rounded-md px-2.5 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100";

const ICON_BTN_DISABLED =
  "flex h-9 items-center justify-center rounded-md px-2.5 text-stone-300 dark:text-stone-600 cursor-not-allowed";

export function ReaderToolbar() {
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const arabicFontStyle = useSettingsStore((s) => s.arabicFontStyle);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setArabicFontStyle = useSettingsStore((s) => s.setArabicFontStyle);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const toggleTajwidColors = useSettingsStore((s) => s.toggleTajwidColors);

  const wordByWordMode = usePlayerStore((s) => s.wordByWordMode);
  const setWordByWordMode = usePlayerStore((s) => s.setWordByWordMode);

  const settingsCtx = useContext(SettingsOpenContext);

  const decreaseFont = () =>
    setArabicFontSize(Math.max(FONT_MIN, arabicFontSize - FONT_STEP));
  const increaseFont = () =>
    setArabicFontSize(Math.min(FONT_MAX, arabicFontSize + FONT_STEP));

  return (
    <div
      className="hidden lg:flex sticky top-[var(--app-header-offset)] z-20 -mx-4 mb-6 flex-wrap items-center gap-2 border-b border-[var(--theme-border)] bg-[var(--theme-card)]/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--theme-card)]/85 transition-[top] duration-200"
      role="toolbar"
      aria-label="Postavke čitanja"
    >
      {/* Font size cluster */}
      <div className="flex items-center gap-0.5 rounded-md border border-[var(--theme-border)] p-0.5">
        <button
          type="button"
          onClick={decreaseFont}
          disabled={arabicFontSize <= FONT_MIN}
          aria-label="Manja slova"
          className={arabicFontSize <= FONT_MIN ? ICON_BTN_DISABLED : ICON_BTN}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="min-w-[2.5rem] text-center text-xs font-medium tabular-nums text-stone-600 dark:text-stone-300">
          <span className="sr-only">Veličina slova: </span>
          {arabicFontSize}
        </span>
        <button
          type="button"
          onClick={increaseFont}
          disabled={arabicFontSize >= FONT_MAX}
          aria-label="Veća slova"
          className={arabicFontSize >= FONT_MAX ? ICON_BTN_DISABLED : ICON_BTN}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Font style */}
      <div
        className="flex items-center gap-0.5 rounded-md border border-[var(--theme-border)] p-0.5"
        role="group"
        aria-label="Arapsko pismo"
      >
        <button
          type="button"
          onClick={() => setArabicFontStyle("naskh")}
          aria-pressed={arabicFontStyle === "naskh"}
          className={`flex h-9 items-center justify-center rounded px-3 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            arabicFontStyle === "naskh"
              ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50"
              : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          }`}
        >
          Osnovno
        </button>
        <button
          type="button"
          onClick={() => setArabicFontStyle("uthmanic")}
          aria-pressed={arabicFontStyle === "uthmanic"}
          className={`flex h-9 items-center justify-center rounded px-3 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            arabicFontStyle === "uthmanic"
              ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50"
              : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          }`}
        >
          Klasično
        </button>
      </div>

      {/* View toggle */}
      <div
        className="flex items-center gap-0.5 rounded-md border border-[var(--theme-border)] p-0.5"
        role="group"
        aria-label="Praćenje uz zvuk"
      >
        <button
          type="button"
          onClick={() => setWordByWordMode(false)}
          aria-pressed={!wordByWordMode}
          className={`flex h-9 items-center justify-center rounded px-3 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            !wordByWordMode
              ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50"
              : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          }`}
        >
          Po ajetu
        </button>
        <button
          type="button"
          onClick={() => setWordByWordMode(true)}
          aria-pressed={wordByWordMode}
          className={`flex h-9 items-center justify-center rounded px-3 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            wordByWordMode
              ? "bg-stone-200 text-stone-900 dark:bg-stone-600 dark:text-stone-50"
              : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
          }`}
        >
          Riječ po riječ
        </button>
      </div>

      {/* Display chips */}
      <div className="flex items-center gap-1" aria-label="Prikaz">
        <ToggleChip
          active={showTransliteration}
          onClick={toggleTransliteration}
          label="Transliteracija"
        />
        <ToggleChip
          active={showTranslation}
          onClick={toggleTranslation}
          label="Prijevod"
        />
        <ToggleChip
          active={showTajwidColors}
          onClick={toggleTajwidColors}
          label="Tedžvid boje"
        />
      </div>

      {/* Settings entry — far right */}
      <div className="ml-auto">
        {settingsCtx ? (
          <button
            type="button"
            onClick={() => settingsCtx.open()}
            className={ICON_BTN}
          >
            <SettingsIcon className="h-4 w-4" aria-hidden />
            <span className="ml-1.5 text-xs font-medium">Postavke</span>
          </button>
        ) : (
          <Link href="/settings" className={ICON_BTN}>
            <SettingsIcon className="h-4 w-4" aria-hidden />
            <span className="ml-1.5 text-xs font-medium">Postavke</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "border-stone-200 bg-transparent text-stone-500 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800"
      }`}
    >
      {label}
    </button>
  );
}

