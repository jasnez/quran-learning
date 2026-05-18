import { NextResponse } from "next/server";
import { getAllSurahs } from "@/lib/data/static-quran";

const CACHE_MAX_AGE = 86400;

export async function GET() {
  const surahs = getAllSurahs();
  return NextResponse.json(
    { surahs },
    { headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE } }
  );
}
