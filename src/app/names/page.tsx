import type { Metadata } from "next";
import { NamesPageContent } from "@/components/names/NamesPageContent";

export const metadata: Metadata = {
  title: "Allahova lijepa imena",
  description:
    "El-Esmāʼul-Ḥusnā: 99 Allahovih lijepih imena s arapskim tekstom, transkripcijom i prijevodom.",
};

export default function NamesPage() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-read font-bold text-ink md:text-3xl">
          Allahova lijepa imena
        </h1>
        <p className="mb-8 text-ink-muted">
          El-Esmāʼul-Ḥusnā: 99 Allahovih lijepih imena s arapskim tekstom, transkripcijom i prijevodom
        </p>
        <NamesPageContent />
      </div>
    </div>
  );
}
