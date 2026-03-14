"use client";

import { DUAS_BY_CATEGORY } from "@/lib/duas/data";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/duas/categories";
import { DuaCard } from "./DuaCard";

export function DuasPageContent() {
  return (
    <div className="space-y-12">
      {CATEGORY_ORDER.map((category) => {
        const duas = DUAS_BY_CATEGORY[category];
        if (duas.length === 0) return null;
        return (
          <section
            key={category}
            aria-labelledby={`duas-category-${category}`}
          >
            <h2
              id={`duas-category-${category}`}
              className="mb-6 text-lg font-semibold text-stone-800 dark:text-stone-200"
            >
              {CATEGORY_LABELS[category]}
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
