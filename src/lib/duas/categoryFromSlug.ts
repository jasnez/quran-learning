import type { DuaCategory } from "@/types/duas";

const VALID_SLUGS: DuaCategory[] = [
  "forgiveness",
  "knowledge",
  "guidance",
  "patience",
  "family",
  "rabbana",
];

export function isValidCategorySlug(slug: string): slug is DuaCategory {
  return (VALID_SLUGS as string[]).includes(slug);
}

export function categoryFromSlug(slug: string): DuaCategory | undefined {
  return isValidCategorySlug(slug) ? slug : undefined;
}
