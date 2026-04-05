"use client";

import { useRef, useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import type { RepeatMode, PauseAfterAyah } from "@/types/settings";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";

const FONT_MIN = 20;
const FONT_MAX = 44;
const FONT_STEP = 4;

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

const PAUSE_OPTIONS: { value: PauseAfterAyah; label: string }[] = [
  { value: "off", label: "Odmah" },
  { value: "3s", label: "3 sek" },
  { value: "5s", label: "5 sek" },
  { value: "10s", label: "10 sek" },
  { value: "manual", label: "Ručno" },
];
const THEMES = [
  { value: "light" as const, label: "Light", labelBs: "Svijetla" },
  { value: "dark" as const, label: "Dark", labelBs: "Tamna" },
  { value: "sepia" as const, label: "Sepia", labelBs: "Sepia" },
] as const;

type SettingsPanelProps = { isOpen: boolean; onClose: () => void };

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const theme = useSettingsStore((s) => s.theme);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const arabicFontStyle = useSettingsStore((s) => s.arabicFontStyle);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTajwidColors = useSettingsStore((s) => s.showTajwidColors);
  const selectedReciterId = useSettingsStore((s) => s.selectedReciterId);
  const playbackSpeed = useSettingsStore((s) => s.playbackSpeed);
  const repeatMode = useSettingsStore((s) => s.repeatMode);
  const autoPlayNext = useSettingsStore((s) => s.autoPlayNext);
  const pauseAfterAyah = useSettingsStore((s) => s.pauseAfterAyah);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setArabicFontSize = useSettingsStore((s) => s.setArabicFontSize);
  const setArabicFontStyle = useSettingsStore((s) => s.setArabicFontStyle);
  const toggleTransliteration = useSettingsStore((s) => s.toggleTransliteration);
  const toggleTranslation = useSettingsStore((s) => s.toggleTranslation);
  const toggleTajwidColors = useSettingsStore((s) => s.toggleTajwidColors);
  const setPlaybackSpeed = useSettingsStore((s) => s.setPlaybackSpeed);
  const cycleRepeatMode = useSettingsStore((s) => s.cycleRepeatMode);
  const toggleAutoPlayNext = useSettingsStore((s) => s.toggleAutoPlayNext);
  const setPauseAfterAyah = useSettingsStore((s) => s.setPauseAfterAyah);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const fontDecrease = () =>
    setArabicFontSize(Math.max(FONT_MIN, arabicFontSize - FONT_STEP));
  const fontIncrease = () =>
    setArabicFontSize(Math.min(FONT_MAX, arabicFontSize + FONT_STEP));

  const reciterLabel =
    selectedReciterId === "mishary-alafasy" ? "Mishary Alafasy" : selectedReciterId ?? "—";

  return (
    <>
      <div
        data-settings-overlay
        role="presentation"
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleOverlayClick}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--theme-border)] bg-[var(--theme-card)] shadow-xl transition-transform duration-200 ease-out max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[85vh] max-sm:rounded-t-2xl md:max-w-sm ${
          isOpen
            ? "translate-x-0 max-sm:translate-y-0"
            : "translate-x-full pointer-events-none max-sm:translate-y-full"
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h2 id="settings-panel-title" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Postavke
          </h2>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] rounded-lg p-3 text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-300"
            aria-label="Zatvori"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Display Settings */}
          <section className="mb-8" aria-labelledby="display-heading">
            <h3 id="display-heading" className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Prikaz
            </h3>
            <div className="space-y-4">
              <div>
                <label id="font-size-label" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Veličina arapskog fonta
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                    aria-label="Smanji veličinu fonta"
                    disabled={arabicFontSize <= FONT_MIN}
                    onClick={fontDecrease}
                  >
                    −
                  </button>
                  <span
                    className="min-w-[3rem] text-center text-stone-900 dark:text-stone-100"
                    aria-live="polite"
                  >
                    {arabicFontSize}
                  </span>
                  <button
                    type="button"
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                    aria-label="Povećaj veličinu fonta"
                    disabled={arabicFontSize >= FONT_MAX}
                    onClick={fontIncrease}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <span id="font-style-label" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Stil arapskog fonta
                </span>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="font-style-label">
                  {(["naskh", "uthmanic"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        arabicFontStyle === style
                          ? "bg-emerald-600 text-white dark:bg-emerald-500"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                      }`}
                      aria-pressed={arabicFontStyle === style}
                      onClick={() => {
                        setArabicFontStyle(style);
                        document.documentElement.setAttribute("data-arabic-font", style);
                      }}
                    >
                      {style === "naskh" ? "Naskh (zaobljen)" : "Uthmanic HAFS"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Naskh = blago zaobljena slova (kao u mushafu). Uthmanic = klasični rukopisni stil.
                </p>
              </div>
              <ToggleRow
                id="transliteration"
                label="Transliteracija"
                checked={showTransliteration}
                onChange={toggleTransliteration}
              />
              <ToggleRow
                id="translation"
                label="Prijevod"
                checked={showTranslation}
                onChange={toggleTranslation}
              />
              <ToggleRow
                id="tajwid"
                label="Tajwid boje"
                checked={showTajwidColors}
                onChange={toggleTajwidColors}
              />
            </div>
          </section>

          {/* Audio Settings */}
          <section className="mb-8" aria-labelledby="audio-heading">
            <h3 id="audio-heading" className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Zvuk
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Recitator
                </span>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {reciterLabel}
                </p>
              </div>
              <div>
                <span className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Brzina reprodukcije
                </span>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Brzina reprodukcije">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        playbackSpeed === speed
                          ? "bg-emerald-600 text-white dark:bg-emerald-500"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                      }`}
                      aria-pressed={playbackSpeed === speed}
                      aria-label={`${speed}x`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
              <RepeatModeRow
                id="repeat"
                repeatMode={repeatMode}
                onCycle={cycleRepeatMode}
              />
              <ToggleRow
                id="autoplay"
                label="Automatski puštaj sljedeći ajet"
                checked={autoPlayNext}
                onChange={toggleAutoPlayNext}
              />
              <div>
                <span id="pause-after-ayah-label" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Pauza između ajeta
                </span>
                <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">
                  Koliko čekati nakon svakog ajeta prije nego pređe na sljedeći.
                  &ldquo;Ručno&rdquo; čeka dok ne klikneš &ldquo;Nastavi&rdquo;.
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="pause-after-ayah-label">
                  {PAUSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pauseAfterAyah === opt.value
                          ? "bg-emerald-600 text-white dark:bg-emerald-500"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                      }`}
                      aria-pressed={pauseAfterAyah === opt.value}
                      onClick={() => setPauseAfterAyah(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Offline */}
          <OfflineSection />

          {/* Theme */}
          <section aria-labelledby="theme-heading">
            <h3 id="theme-heading" className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
              Tema
            </h3>
            <div
              className="flex gap-2"
              role="radiogroup"
              aria-labelledby="theme-heading"
            >
              {THEMES.map((t) => (
                <label
                  key={t.value}
                  className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 dark:has-[:checked]:bg-emerald-900/30 dark:has-[:checked]:text-emerald-300 dark:has-[:checked]:border-emerald-500"
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t.value}
                    checked={theme === t.value}
                    onChange={() => setTheme(t.value)}
                    className="sr-only"
                    aria-label={t.labelBs}
                  />
                  {t.labelBs}
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: "Isključeno",
  surah: "Ponavljaj suru",
  ayah: "Ponavljaj ajet",
};

function RepeatModeRow({
  id,
  repeatMode,
  onCycle,
}: {
  id: string;
  repeatMode: RepeatMode;
  onCycle: () => void;
}) {
  const label = REPEAT_LABELS[repeatMode];
  return (
    <div className="flex items-center justify-between">
      <span id={`${id}-label`} className="text-sm font-medium text-stone-700 dark:text-stone-300">
        Ponavljanje
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={repeatMode !== "off"}
        aria-label={`Ponavljanje: ${label}. Klik za promjenu.`}
        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          repeatMode !== "off"
            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500"
            : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
        }`}
        onClick={onCycle}
      >
        {label}
      </button>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          checked ? "bg-emerald-600 dark:bg-emerald-500" : "bg-stone-200 dark:bg-stone-600"
        }`}
        onClick={onChange}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function OfflineSection() {
  const { start, cancel, reset, status, progress, progressPercent } = useOfflineDownload();

  const TOTAL = 114;

  return (
    <section aria-labelledby="offline-heading">
      <h3
        id="offline-heading"
        className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400"
      >
        Offline čitanje
      </h3>

      {status === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Preuzmite sve sure da biste čitali Kur'an bez internet veze.
          </p>
          <button
            type="button"
            onClick={start}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Preuzmi sve sure za offline
          </button>
        </div>
      )}

      {status === "downloading" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-700 dark:text-stone-300">
              Preuzimanje {progress}/{TOTAL}…
            </span>
            <span className="tabular-nums text-stone-500 dark:text-stone-400">
              {progressPercent}%
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={cancel}
            className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            Otkaži
          </button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span aria-hidden>✓</span>
            Sve sure su preuzete za offline čitanje.
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            Ponovi preuzimanje
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            Preuzimanje nije uspjelo za neke sure. Provjerite internet vezu.
          </div>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Pokušaj ponovo
          </button>
        </div>
      )}
    </section>
  );
}
