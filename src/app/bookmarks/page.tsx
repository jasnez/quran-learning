import type { Metadata } from "next";
import { getAllSurahs } from "@/lib/data";
import { BookmarksContent } from "@/components/bookmarks";

export const metadata: Metadata = {
  title: "Označeni ajeti | Quran Learning",
  description: "Pregled ajeta koje ste označili dok čitate.",
};

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const surahs = await getAllSurahs();
  return <BookmarksContent surahs={surahs} />;
}
