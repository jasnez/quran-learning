import type { MetadataRoute } from "next";
import { getAllTajwidLessons } from "@/data/tajwid-lessons";
import { CATEGORY_ORDER } from "@/lib/duas/categories";
import { SITE_URL } from "@/lib/site";

/**
 * Pages without a dynamic segment. /bookmarks, /progress, /search and /settings are left out:
 * they show only the visitor's own data or an empty search.
 */
const STATIC_PATHS = [
  "/",
  "/surahs",
  "/duas",
  "/names",
  "/harfovi",
  "/tajwid",
  "/about",
  "/sources",
  "/contact",
];

const range = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

// Required with `output: "export"`: the route is rendered once, at build time.
export const dynamic = "force-static";

/** Written to out/sitemap.xml at build time (static export). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lessons = await getAllTajwidLessons();
  const paths = [
    ...STATIC_PATHS,
    ...range(114).map((n) => `/surah/${n}`),
    ...range(114).map((n) => `/learn/${n}`),
    ...range(30).map((n) => `/juz/${n}`),
    ...CATEGORY_ORDER.map((category) => `/duas/${category}`),
    ...lessons.map((lesson) => `/tajwid/${lesson.slug}`),
  ];
  return paths.map((p) => ({ url: p === "/" ? SITE_URL : `${SITE_URL}${p}` }));
}
