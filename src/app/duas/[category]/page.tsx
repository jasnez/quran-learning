import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { DuasPageContent } from "@/components/duas/DuasPageContent";
import { categoryFromSlug } from "@/lib/duas/categoryFromSlug";
import { CATEGORY_LABELS } from "@/lib/duas/categories";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) return { title: "Kur'anske dove | Quran Learning" };
  return {
    title: `${CATEGORY_LABELS[cat]} | Kur'anske dove | Quran Learning`,
    description: `Kur'anske dove – kategorija ${CATEGORY_LABELS[cat]}. Sa tačnom referencom (sura i ajet).`,
  };
}

export default async function CategoryDuasPage({ params }: PageProps) {
  const { category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) notFound();

  return (
    <main className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2">
          <Link
            href="/duas"
            className="text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
          >
            ← Sve Kur&apos;anske dove
          </Link>
        </p>
        <h1 className="mb-2 text-2xl font-semibold text-[var(--theme-text)] md:text-3xl">
          {CATEGORY_LABELS[cat]}
        </h1>
        <p className="mb-8 text-stone-500 dark:text-stone-400">
          Dove iz Kur&apos;ana – kategorija sa tačnom referencom (sura i ajet)
        </p>
        <DuasPageContent category={cat} />
      </div>
    </main>
  );
}
