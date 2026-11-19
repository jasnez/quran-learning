import type { Metadata } from "next";
import { getAllSurahs } from "@/lib/data";
import { BookmarksContent } from "@/components/bookmarks";

export const metadata: Metadata = {
  title: "Sačuvani ajeti",
  description: "Ajeti sačuvani tokom čitanja, s bilješkama.",
};

export default async function BookmarksPage() {
  const surahs = await getAllSurahs();
  return <BookmarksContent surahs={surahs} />;
}
