"use client";

import { useRef } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { BackToTop } from "./BackToTop";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Toast } from "@/components/ui/Toast";
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
        <div
          ref={scrollContainerRef}
          className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-[var(--theme-bg)] transition-colors duration-200"
          data-scroll-container
        >
          <Header />
          <main
            className={`min-h-0 px-4 py-8 transition-opacity duration-300 md:py-12 md:pb-12 ${
              hasAudio ? "max-md:pb-[126px] pb-24" : "pb-24"
            }`}
          >
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <Footer />
          <BackToTop />
          <AudioPlayer />
          <MobileNav />
          <Toast />
        </div>
      </ScrollContainerProvider>
      <SettingsPanelGate />
    </SettingsOpenProvider>
  );
}
