import type { SurahSummary } from "@/types/quran";
import { SurahListItem } from "./SurahListItem";

export function SurahList({ surahs }: { surahs: SurahSummary[] }) {
  return (
    <ul className="space-y-3" role="list">
      {surahs.map((surah) => (
        <li key={surah.id}>
          <SurahListItem surah={surah} />
        </li>
      ))}
    </ul>
  );
}
