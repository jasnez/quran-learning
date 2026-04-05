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
          className="flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto bg-[var(--theme-bg)] pt-12 transition-colors duration-200"
          data-scroll-container
        >
          <Header />
          <main
            className={`min-h-0 flex-1 px-4 py-8 transition-opacity duration-300 md:py-12 ${
              hasAudio ? "max-md:pb-[126px] md:pb-16" : "pb-10 md:pb-16"
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
