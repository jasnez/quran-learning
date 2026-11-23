"use client";

import { useRef } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { BackToTop } from "./BackToTop";
import dynamic from "next/dynamic";

const AudioPlayer = dynamic(
  () => import("@/components/audio/AudioPlayer").then((m) => ({ default: m.AudioPlayer })),
  { ssr: false }
);
const SettingsPanel = dynamic(
  () => import("@/components/settings/SettingsPanel").then((m) => ({ default: m.SettingsPanel })),
  { ssr: false }
);
import { Toast } from "@/components/ui/Toast";
import { TajwidRuleBar } from "@/components/quran/TajwidRuleBar";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { SettingsOpenProvider, useSettingsOpen } from "@/contexts/SettingsOpenContext";
import { ScrollContainerProvider } from "@/contexts/ScrollContainerContext";
import { usePlayerStore } from "@/store/playerStore";

function SettingsPanelGate() {
  const { isOpen, close } = useSettingsOpen();
  return <SettingsPanel isOpen={isOpen} onClose={close} />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hasAudio = usePlayerStore((s) => !!s.activeAudioSrc);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <SettingsOpenProvider>
      <ScrollContainerProvider scrollContainerRef={scrollContainerRef}>
        {/* The bottom padding keeps the end of the page, the footer included, clear of the fixed
            bottom bars: the mobile navigation (56px) and the audio player (70px). */}
        <div
          ref={scrollContainerRef}
          className={`flex min-h-dvh flex-col bg-background pt-12 transition-colors duration-200 ${
            hasAudio ? "max-md:pb-[126px] md:pb-[70px]" : "max-md:pb-14"
          }`}
          data-scroll-container
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-lg focus-visible:outline-2 focus-visible:outline-accent-text"
          >
            Preskoči na sadržaj
          </a>
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="focus-visible:outline-hidden min-h-0 flex-1 px-4 py-8 pb-10 transition-opacity duration-300 md:py-12 md:pb-16"
          >
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <Footer />
          <BackToTop />
          <AudioPlayer />
          <MobileNav />
          <TajwidRuleBar />
          <Toast />
          <OfflineIndicator />
        </div>
      </ScrollContainerProvider>
      <SettingsPanelGate />
    </SettingsOpenProvider>
  );
}
