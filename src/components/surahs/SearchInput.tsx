"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Pretraži po broju ili nazivu...",
}: SearchInputProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-[#faf9f7] px-4 pb-3 dark:bg-stone-950 md:static md:mx-0 md:bg-transparent md:p-0">
      <label htmlFor="surah-search" className="sr-only">
        Pretraži sure
      </label>
      <input
        id="surah-search"
        type="search"
        role="searchbox"
        aria-label="Pretraži sure po broju ili nazivu"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-4 pr-4 text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
      />
    </div>
  );
}
