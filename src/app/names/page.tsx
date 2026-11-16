import type { Metadata } from "next";
import { NamesPageContent } from "@/components/names/NamesPageContent";

export const metadata: Metadata = {
  title: "Allahova lijepa imena | Quran Learning",
  description:
    "El-Esmāʼul-Ḥusnā – 99 Allahovih lijepih imena s arapskim tekstom, transliteracijom i prijevodom na bosanski.",
};

export default function NamesPage() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--theme-text)] md:text-3xl">
          Allahova lijepa imena
        </h1>
        <p className="mb-8 text-stone-500 dark:text-stone-400">
          El-Esmāʼul-Ḥusnā – 99 imena: arapski, transliteracija i prijevod na bosanski
        </p>
        <NamesPageContent />
      </div>
    </div>
  );
}
