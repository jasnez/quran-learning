"use client";

import { useRef, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import type { RepeatMode, PauseAfterAyah } from "@/types/settings";
import { SURAH_FORMS, formatCount, formatNumber, pluralForm, type PluralForms } from "@/lib/format";
import { useOfflineDownload, TOTAL_SURAHS, type SurahFailure } from "@/hooks/useOfflineDownload";

const FONT_MIN = 20;
const FONT_MAX = 44;
const FONT_STEP = 4;

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

const SECOND_FORMS: PluralForms = { one: "sekunda", few: "sekunde", other: "sekundi" };
const MISSING_VERB: PluralForms = { one: "Nedostaje", few: "Nedostaju", other: "Nedostaje" };

function missingAssetsSentence(count: number): string {
  const n = formatNumber(count);
  return pluralForm(count, {
    one: `Nedostaje ${n} dio aplikacije potreban za prikaz sura.`,
    few: `Nedostaju ${n} dijela aplikacije potrebna za prikaz sura.`,
    other: `Nedostaje ${n} dijelova aplikacije potrebnih za prikaz sura.`,
  });
}

const PAUSE_OPTIONS: { value: PauseAfterAyah; label: string }[] = [
  { value: "off", label: "Odmah" },
  { value: "3s", label: formatCount(3, SECOND_FORMS) },
  { value: "5s", label: formatCount(5, SECOND_FORMS) },
  { value: "10s", label: formatCount(10, SECOND_FORMS) },
  { value: "manual", label: "Ručno" },
];
const PRIMARY_THEMES = [
  { value: "light" as const, label: "Svijetla" },
  { value: "dark" as const, label: "Tamna" },
] as const;
const ADVANCED_THEMES = [
  { value: "sepia" as const, label: "Sepia" },
] as const;

type SettingsPanelProps = { isOpen: boolean; onClose: () => void };

/** Light dismiss (click on the backdrop) for browsers without dialog closedby (Safari). */
function isOutside(e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement): boolean {
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

/**
 * A native modal <dialog> (QA section 5): showModal() makes the rest of the page inert, keeps
 * Tab inside the panel, closes on Esc and returns focus to the control that opened it. While
 * closed the dialog is display: none, so none of its controls can take focus.
 */
export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

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
  const setRepeatMode = useSettingsStore((s) => s.setRepeatMode);
  const toggleAutoPlayNext = useSettingsStore((s) => s.toggleAutoPlayNext);
  const setPauseAfterAyah = useSettingsStore((s) => s.setPauseAfterAyah);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Native closedby="any" handles the backdrop where supported. Press and release must both be
  // outside, so a text selection that ends on the backdrop does not close the panel.
  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const hasNativeLightDismiss = "closedBy" in HTMLDialogElement.prototype;
    pressedOutsideRef.current = !hasNativeLightDismiss && isOutside(e, e.currentTarget);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (pressedOutsideRef.current && isOutside(e, e.currentTarget)) e.currentTarget.close();
    pressedOutsideRef.current = false;
  };

  const fontDecrease = () =>
    setArabicFontSize(Math.max(FONT_MIN, arabicFontSize - FONT_STEP));
  const fontIncrease = () =>
    setArabicFontSize(Math.min(FONT_MAX, arabicFontSize + FONT_STEP));

  const reciterLabel =
    selectedReciterId === "mishary-alafasy" ? "Mishary Alafasy" : selectedReciterId ?? "—";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-panel-title"
      // The slide-out keeps the closed panel on screen for 200ms; inert keeps its controls out
      // of reach meanwhile. React sets it before the effect calls close(), and removes it before
      // showModal().
      inert={!isOpen}
      closedby="any"
      className="settings-dialog"
      onClose={onClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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
                        arabicFontStyle === style ? OPTION_SELECTED : OPTION_IDLE
                      }`}
                      aria-pressed={arabicFontStyle === style}
                      onClick={() => {
                        setArabicFontStyle(style);
                        document.documentElement.setAttribute("data-arabic-font", style);
                      }}
                    >
                      {style === "naskh" ? "Naskh (zaobljen)" : "Scheherazade"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Naskh = blago zaobljena slova (kao u mushafu). Scheherazade = tradicionalni kur&apos;anski stil.
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
                label="Tedžvid boje"
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
                        playbackSpeed === speed ? OPTION_SELECTED : OPTION_IDLE
                      }`}
                      aria-pressed={playbackSpeed === speed}
                      aria-label={`${formatNumber(speed)}×`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {formatNumber(speed)}×
                    </button>
                  ))}
                </div>
              </div>
              <RepeatModeRow repeatMode={repeatMode} onChange={setRepeatMode} />
              <ToggleRow
                id="autoplay"
                label="Sljedeća sura automatski"
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
                        pauseAfterAyah === opt.value ? OPTION_SELECTED : OPTION_IDLE
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
          <OfflineSection active={isOpen} />

          {/* Theme */}
          <ThemeSection theme={theme} setTheme={setTheme} />
        </div>
    </dialog>
  );
}

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: "off", label: "Isključeno" },
  { value: "surah", label: "Sura" },
  { value: "ayah", label: "Ajet" },
];

/** Three modes, so a group of options like "Pauza između ajeta", not an on/off switch (QA section 5). */
function RepeatModeRow({
  repeatMode,
  onChange,
}: {
  repeatMode: RepeatMode;
  onChange: (mode: RepeatMode) => void;
}) {
  return (
    <div>
      <span id="repeat-mode-label" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
        Ponavljanje
      </span>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="repeat-mode-label">
        {REPEAT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              repeatMode === opt.value ? OPTION_SELECTED : OPTION_IDLE
            }`}
            aria-pressed={repeatMode === opt.value}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
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
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
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

type ThemeValue = "light" | "dark" | "sepia";

function ThemeSection({
  theme,
  setTheme,
}: {
  theme: ThemeValue;
  setTheme: (t: ThemeValue) => void;
}) {
  const isAdvanced = ADVANCED_THEMES.some((t) => t.value === theme);
  const [showAdvanced, setShowAdvanced] = useState(isAdvanced);

  return (
    <section aria-labelledby="theme-heading">
      <h3
        id="theme-heading"
        className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400"
      >
        Tema
      </h3>
      <div className="flex gap-2" role="radiogroup" aria-labelledby="theme-heading">
        {PRIMARY_THEMES.map((t) => (
          <label
            key={t.value}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 dark:has-[:checked]:bg-emerald-900/30 dark:has-[:checked]:text-emerald-300 dark:has-[:checked]:border-emerald-500"
          >
            <input
              type="radio"
              name="theme"
              value={t.value}
              checked={theme === t.value}
              onChange={() => setTheme(t.value)}
              className="sr-only"
              aria-label={t.label}
            />
            {t.label}
          </label>
        ))}
      </div>
      {showAdvanced ? (
        <div
          className="mt-2 flex gap-2"
          role="radiogroup"
          aria-label="Dodatne teme"
        >
          {ADVANCED_THEMES.map((t) => (
            <label
              key={t.value}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700 dark:has-[:checked]:bg-emerald-900/30 dark:has-[:checked]:text-emerald-300 dark:has-[:checked]:border-emerald-500"
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={theme === t.value}
                onChange={() => setTheme(t.value)}
                className="sr-only"
                aria-label={t.label}
              />
              {t.label}
            </label>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdvanced(true)}
          className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        >
          Više opcija…
        </button>
      )}
    </section>
  );
}

// White on emerald-700 is 5.5:1; on emerald-600 it was 3.65:1 and on emerald-500 2.5:1 (QA section 5).
const OPTION_SELECTED = "bg-emerald-700 text-white";
const OPTION_IDLE =
  "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600";

const SECONDARY_BUTTON =
  "w-full rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 transition-colors hover:bg-stone-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800";
const PRIMARY_BUTTON =
  "w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600";

function failureHints(failures: SurahFailure[]): string[] {
  const hints: string[] = [];
  if (failures.some((f) => f.reason === "network")) hints.push("Provjerite internet vezu.");
  const statuses = [...new Set(failures.flatMap((f) => (f.httpStatus ? [f.httpStatus] : [])))];
  if (statuses.length > 0) hints.push(`Server je vratio grešku (${statuses.join(", ")}).`);
  if (failures.some((f) => f.reason === "not-saved")) {
    hints.push("Preglednik ih nije spremio (možda nema dovoljno prostora).");
  }
  return hints;
}

function OfflineSection({ active }: { active: boolean }) {
  const {
    start,
    retry,
    cancel,
    status,
    error,
    progress,
    total,
    progressPercent,
    availableCount,
    failures,
    failedAssetCount,
  } = useOfflineDownload({ active });

  const availableLine = (
    <p className="text-sm text-stone-600 dark:text-stone-400">
      Preuzeto: {formatNumber(availableCount)} od {formatNumber(TOTAL_SURAHS)} sura.
    </p>
  );

  return (
    <section aria-labelledby="offline-heading">
      <h3
        id="offline-heading"
        className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400"
      >
        Offline čitanje
      </h3>

      {status === "unsupported" ? (
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Ovaj preglednik ne podržava spremanje sura za čitanje bez interneta.
        </p>
      ) : (
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-400">
          Preuzimanje sprema tekst svih {TOTAL_SURAHS} sura (arapski tekst, prijevod i transliteraciju) za čitanje
          bez interneta, oko 40 MB. Audio (učenje) nije uključen: za slušanje je uvijek potrebna internet veza.
        </p>
      )}

      {status === "checking" && (
        <p className="text-sm text-stone-500 dark:text-stone-400" role="status">
          Provjeravam šta je već spremljeno…
        </p>
      )}

      {status === "idle" && (
        <div className="space-y-3">
          {availableCount > 0 && availableLine}
          <button type="button" onClick={start} className={PRIMARY_BUTTON}>
            Preuzmi sve sure za offline
          </button>
        </div>
      )}

      {status === "downloading" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-700 dark:text-stone-300">
              Preuzimanje: {formatNumber(progress)} od {formatNumber(total)} sura
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
          <button type="button" onClick={cancel} className={SECONDARY_BUTTON}>
            Otkaži
          </button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            <span aria-hidden>✓</span>
            Svih {TOTAL_SURAHS} sura je spremljeno za čitanje bez interneta.
          </div>
          <button type="button" onClick={start} className={SECONDARY_BUTTON}>
            Preuzmi ponovo
          </button>
        </div>
      )}

      {status === "error" && error === "not-controlled" && (
        <div className="space-y-3" role="alert">
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            Ništa nije spremljeno: offline način još nije aktivan na ovoj stranici. Osvježite stranicu i
            pokušajte ponovo.
          </div>
          <button type="button" onClick={start} className={PRIMARY_BUTTON}>
            Pokušaj ponovo
          </button>
        </div>
      )}

      {status === "error" && error === "incomplete" && (
        <div className="space-y-3" role="alert">
          <div className="space-y-1 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-medium">Preuzimanje nije završeno.</p>
            {failures.length > 0 && (
              <p>
                {pluralForm(failures.length, MISSING_VERB)} {formatCount(failures.length, SURAH_FORMS)}: {failures.map((f) => f.surah).join(", ")}.
              </p>
            )}
            {failedAssetCount > 0 && (
              <p>{missingAssetsSentence(failedAssetCount)}</p>
            )}
            {failureHints(failures).map((hint) => (
              <p key={hint}>{hint}</p>
            ))}
          </div>
          {availableLine}
          <button type="button" onClick={retry} className={PRIMARY_BUTTON}>
            Pokušaj ponovo
          </button>
        </div>
      )}
    </section>
  );
}
