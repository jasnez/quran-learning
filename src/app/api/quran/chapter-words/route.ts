import { NextResponse } from "next/server";

const VERSES_API = "https://api.quran.com/api/v4/verses/by_chapter";
const CACHE_MAX_AGE = 86400; // 24h

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapter = searchParams.get("chapter");
  const surahNumber = parseInt(chapter ?? "", 10);
  if (Number.isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json(
      { error: "Invalid chapter (use 1–114)" },
      { status: 400 }
    );
  }
  try {
    const url = `${VERSES_API}/${surahNumber}?language=en&words=true&word_fields=text_uthmani&per_page=300`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream error: ${res.status}`, details: text },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": `public, max-age=${CACHE_MAX_AGE}` },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("API quran chapter-words:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
