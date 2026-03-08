"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Toast } from "@/components/ui/Toast";
import { SettingsOpenProvider, useSettingsOpen } from "@/contexts/SettingsOpenContext";
import { usePlayerStore } from "@/store/playerStore";

function SettingsPanelGate() {
  const { isOpen, close } = useSettingsOpen();
  return <SettingsPanel isOpen={isOpen} onClose={close} />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hasAudio = usePlayerStore((s) => !!s.activeAudioSrc);
  return (
    <SettingsOpenProvider>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--theme-bg)] transition-colors duration-200">
        <Header />
        <main
          className={`min-w-0 flex-1 px-4 py-8 transition-opacity duration-300 md:py-12 md:pb-12 ${
            hasAudio ? "max-md:pb-[126px] pb-24" : "pb-24"
          }`}
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <Footer />
        <AudioPlayer />
        <MobileNav />
        <Toast />
      </div>
      <SettingsPanelGate />
    </SettingsOpenProvider>
  );
}
