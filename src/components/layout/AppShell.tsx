import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { AudioPlayer } from "@/components/audio/AudioPlayer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--theme-bg)] transition-colors duration-200">
      <Header />
      <main className="min-w-0 flex-1 px-4 py-8 pb-24 transition-opacity duration-300 md:py-12 md:pb-12">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <Footer />
      <AudioPlayer />
      <MobileNav />
    </div>
  );
}
