"use client";

import { DUAS_BY_CATEGORY } from "@/lib/duas/data";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/duas/categories";
import { DuaCard } from "./DuaCard";
import type { DuaCategory } from "@/types/duas";

type DuasPageContentProps = {
  /** When set, show only this category's duas (e.g. from /duas/forgiveness). */
  category?: DuaCategory;
};

export function DuasPageContent({ category }: DuasPageContentProps) {
  const categoriesToShow: DuaCategory[] = category
    ? [category]
    : CATEGORY_ORDER;

  return (
    <div className="space-y-12">
      {categoriesToShow.map((cat) => {
        const duas = DUAS_BY_CATEGORY[cat];
        if (duas.length === 0) return null;
        return (
          <section
            key={cat}
            aria-labelledby={`duas-category-${cat}`}
          >
            <h2
              id={`duas-category-${cat}`}
              className="mb-6 text-lg font-semibold text-stone-800 dark:text-stone-200"
            >
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {duas.map((dua) => (
                <DuaCard key={dua.id} dua={dua} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
