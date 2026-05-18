import { NextResponse } from "next/server";
import { getAllReciters } from "@/lib/data/static-quran";

const CACHE_MAX_AGE = 86400;

export async function GET() {
  const reciters = getAllReciters();
  return NextResponse.json(
    { reciters },
    { headers: { "Cache-Control": "public, max-age=" + CACHE_MAX_AGE } }
  );
}
