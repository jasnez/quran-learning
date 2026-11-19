import type { Metadata } from "next";
import { DuasPageContent } from "@/components/duas/DuasPageContent";

export const metadata: Metadata = {
  title: "Kur'anske dove | Quran Learning",
  description:
    "Dove iz Kur'ana po kategorijama: za oprost, znanje, uputu, strpljenje, porodicu i Rabbena dove. Uz tačno mjesto u Kur'anu.",
};

export default function DuasPage() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--theme-text)] md:text-3xl">
          Kur&apos;anske dove
        </h1>
        <p className="mb-8 text-stone-500 dark:text-stone-400">
          Dove iz Kur&apos;ana po temama, uz tačno mjesto u Kur&apos;anu (sura i ajet)
        </p>
        <DuasPageContent />
      </div>
    </div>
  );
}
