"use server";

import { searchAyahs } from "@/lib/api/client";

export async function searchAyahsAction(query: string) {
  return searchAyahs(query);
}
