"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Share } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { SITE_NAME } from "@/lib/site";

const DISMISSED_KEY = "quran-pwa-install-dismissed";
const INSTALLED_KEY = "quran-pwa-install-installed";
/** Show banner only after user has been on site for this long, to avoid being intrusive. */
const MIN_SESSION_MS = 30_000;
/** Re-show prompt after this duration if user dismissed. */
const RE_SHOW_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIOS(): boolean {
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) && !("MSStream" in window)
  );
}

// useSyncExternalStore hidracija-sigurno: server vraća false, klijent računa pravu vrijednost
const subscribeNoop = () => () => {};
const getIosSnapshot = () => isIOS();
const getIosServerSnapshot = () => false;

function isAlreadyInstalled(): boolean {
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  if (localStorage.getItem(INSTALLED_KEY) === "1") return true;
  return false;
}

function isRecentlyDismissed(): boolean {
  const ts = parseInt(localStorage.getItem(DISMISSED_KEY) ?? "0", 10);
  if (!ts) return false;
  return Date.now() - ts < RE_SHOW_AFTER_MS;
}

export function InstallPrompt() {
  const isIosBrowser = useSyncExternalStore(
    subscribeNoop,
    getIosSnapshot,
    getIosServerSnapshot,
  );
  const [showBanner, setShowBanner] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isAlreadyInstalled() || isRecentlyDismissed()) return;

    if (isIosBrowser) {
      // iOS Safari ne emituje beforeinstallprompt — pokazujemo upute nakon delay-a
      const timer = setTimeout(() => setShowBanner(true), MIN_SESSION_MS);
      return () => clearTimeout(timer);
    }

    let bannerTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      bannerTimer = setTimeout(() => setShowBanner(true), MIN_SESSION_MS);
    };
    const installedHandler = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* noop */
      }
      setShowBanner(false);
      setShowIosInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      if (bannerTimer) clearTimeout(bannerTimer);
    };
  }, [isIosBrowser]);

  const handleInstall = useCallback(async () => {
    if (isIosBrowser) {
      setShowIosInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          /* noop */
        }
      }
    } catch {
      /* prompt() can throw if called twice — ignore */
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt, isIosBrowser]);

  const closeIosInstructions = useCallback(() => setShowIosInstructions(false), []);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch {
      /* noop */
    }
    setShowBanner(false);
    setShowIosInstructions(false);
  }, []);

  // Non-iOS: only show if we actually got a deferred prompt
  const bannerVisible =
    showBanner && (isIosBrowser || deferredPrompt !== null);

  if (!bannerVisible && !showIosInstructions) return null;

  return (
    <>
      {bannerVisible && (
        <aside
          aria-labelledby="install-prompt-title"
          className="fixed bottom-[72px] left-2 right-2 z-40 md:bottom-4 md:left-auto md:right-4 md:max-w-md"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent-text"
              aria-hidden
            >
              <InstallIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p
                id="install-prompt-title"
                className="text-sm font-medium text-ink"
              >
                Dodaj {SITE_NAME} na početni ekran
              </p>
              <p className="text-xs text-ink-muted">
                Otvara se s početnog ekrana; preuzete sure rade i bez interneta.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstall}
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              Instaliraj
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Zatvori"
              className="shrink-0 rounded-full p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              <CloseIcon />
            </button>
          </div>
        </aside>
      )}

      <ModalDialog
        open={showIosInstructions}
        onClose={closeIosInstructions}
        labelledBy="ios-install-title"
        className="max-w-md"
      >
        <h2
          id="ios-install-title"
          className="text-lg font-semibold text-ink"
        >
          Dodaj na iPhone
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-wash text-xs font-medium text-accent-text">
              1
            </span>
            <span>
              Dodirni ikonu za dijeljenje{" "}
              <Share aria-hidden className="inline-block h-4 w-4 align-text-bottom" />{" "}
              u Safariju.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-wash text-xs font-medium text-accent-text">
              2
            </span>
            <span>
              Izaberi <strong>&bdquo;Dodaj na početni zaslon&ldquo;</strong> (engleski:{" "}
              &bdquo;Add to Home Screen&ldquo;).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-wash text-xs font-medium text-accent-text">
              3
            </span>
            <span>
              Dodirni <strong>&bdquo;Dodaj&ldquo;</strong> gore desno.
            </span>
          </li>
        </ol>
        <button
          type="button"
          onClick={closeIosInstructions}
          className="mt-6 w-full rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          Razumijem
        </button>
      </ModalDialog>
    </>
  );
}

function InstallIcon() {
  return (
    <svg
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
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
