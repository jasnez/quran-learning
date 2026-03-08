import type { Metadata } from "next";
import { getAllSurahs } from "@/lib/data";
import { BookmarksContent } from "@/components/bookmarks";

export const metadata: Metadata = {
  title: "Označeni ajeti | Quran Learning",
  description: "Pregled ajeta koje ste označili dok čitate.",
};

export default function BookmarksPage() {
  const surahs = getAllSurahs();
  return <BookmarksContent surahs={surahs} />;
}
