"use client";

import { ALLAH_NAMES } from "@/lib/names/data";
import { NameCard } from "./NameCard";

export function NamesPageContent() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ALLAH_NAMES.map((name) => (
        <NameCard key={name.index} name={name} />
      ))}
    </div>
  );
}
