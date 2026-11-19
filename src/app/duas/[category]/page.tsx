import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { DuasPageContent } from "@/components/duas/DuasPageContent";
import { categoryFromSlug } from "@/lib/duas/categoryFromSlug";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/duas/categories";

export function generateStaticParams() {
  return CATEGORY_ORDER.map((category) => ({ category }));
}

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) return { title: "Kur'anske dove" };
  return {
    title: `${CATEGORY_LABELS[cat]} | Kur'anske dove`,
    description: `Kur'anske dove: ${CATEGORY_LABELS[cat]}. Uz tačno mjesto u Kur'anu.`,
  };
}

export default async function CategoryDuasPage({ params }: PageProps) {
  const { category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) notFound();

  return (
    <div className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2">
          <Link
            href="/duas"
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Sve dove iz Kur&apos;ana
          </Link>
        </p>
        <h1 className="mb-2 text-2xl font-read font-bold text-ink md:text-3xl">
          {CATEGORY_LABELS[cat]}
        </h1>
        <p className="mb-8 text-ink-muted">
          Dove iz Kur&apos;ana na ovu temu, uz tačno mjesto u Kur&apos;anu
        </p>
        <DuasPageContent category={cat} />
      </div>
    </div>
  );
}
