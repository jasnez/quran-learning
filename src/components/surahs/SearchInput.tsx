"use client";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Broj ili naziv sure",
}: SearchInputProps) {
  return (
    <div className="sticky top-[var(--app-header-offset)] z-10 -mx-4 bg-paper px-4 pb-3 transition-[top] duration-200 md:static md:mx-0 md:bg-transparent md:p-0">
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
        className="w-full rounded-xl border border-line bg-surface py-3 pl-4 pr-4 text-ink placeholder:text-ink-muted focus-visible:border-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
      />
    </div>
  );
}
