import Link from "next/link";
import type { LeadItem, LessonBlock, LessonSection, TajwidLesson } from "@/data/tajwid-lessons";
import { getSurahDetail } from "@/lib/data/static-quran";
import { resolveLessonExample, type LessonExampleRef, type ResolvedLessonExample } from "@/lib/quran/lessonExample";
import { TajwidTextRenderer } from "@/components/quran/TajwidTextRenderer";
import { WithArabic } from "@/components/ui/WithArabic";

export type ResolvedExamples = Map<LessonExampleRef, ResolvedLessonExample>;

/**
 * Resolves every example of a lesson against the ayah data (build time). A missing surah, ayah or
 * a bad word range fails the build instead of showing an empty example.
 */
export async function resolveExamples(lesson: TajwidLesson): Promise<ResolvedExamples> {
  const out: ResolvedExamples = new Map();
  const refs = lesson.sections.flatMap((s) => s.blocks).flatMap((b) => (b.kind === "examples" ? b.examples : []));
  for (const ref of refs) {
    const detail = await getSurahDetail(ref.surah);
    const ayah = detail?.ayahs.find((a) => a.ayahNumber === ref.ayah);
    if (!ayah) throw new Error(`Lesson ${lesson.slug}: no ayah data for ${ref.surah}:${ref.ayah}`);
    out.set(ref, resolveLessonExample(ref, ayah));
  }
  return out;
}

function Lead({ item }: { item: string | LeadItem }) {
  if (typeof item === "string") return <WithArabic text={item} />;
  return (
    <>
      <strong className="font-semibold">{item.lead}</strong> <WithArabic text={item.text} />
    </>
  );
}

function Block({ block, resolved }: { block: LessonBlock; resolved: ResolvedExamples }) {
  switch (block.kind) {
    case "p":
      return <p>{block.lead ? <Lead item={{ lead: block.lead, text: block.text }} /> : <WithArabic text={block.text} />}</p>;
    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i}>
          <Lead item={item} />
        </li>
      ));
      return block.ordered ? (
        <ol className="list-decimal space-y-1 pl-5">{items}</ol>
      ) : (
        <ul className="list-disc space-y-1 pl-5">{items}</ul>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-sunken text-ink">
              <tr>
                {block.columns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-line align-top">
                  {row.map((cell, c) =>
                    c === block.arabicColumn ? (
                      <td key={c} lang="ar" dir="rtl" className="px-3 py-2 font-arabic text-lg leading-relaxed">
                        {cell}
                      </td>
                    ) : c === 0 ? (
                      // The first cell names the row (a term, a kind of length).
                      <th key={c} scope="row" className="px-3 py-2 text-left font-medium">
                        <WithArabic text={cell} />
                      </th>
                    ) : (
                      <td key={c} className="px-3 py-2">
                        <WithArabic text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "examples":
      return (
        <div className="space-y-4">
          {block.examples.map((ref, i) => {
            const ex = resolved.get(ref);
            if (!ex) throw new Error(`Lesson example ${ref.surah}:${ref.ayah} was not resolved`);
            return (
              <div key={i} data-lesson-example className="rounded-xl border border-line bg-surface p-4">
                {/* Colors on: the lesson is about the colors, whatever the reader setting is. */}
                <TajwidTextRenderer segments={ex.segments} showColors className="text-center text-2xl text-ink" />
                <p className="mt-2 text-center font-transliteration text-sm text-ink-muted" dir="ltr">
                  {ex.transliteration}
                </p>
                <p className="mt-3 text-sm text-ink">
                  <WithArabic text={ref.note} />
                </p>
                <p className="mt-2 text-sm">
                  <Link href={ex.href} className="text-accent-text underline underline-offset-2">
                    Sura {ref.surah}, ajet {ref.ayah}
                  </Link>
                </p>
              </div>
            );
          })}
        </div>
      );
  }
}

/** One lesson section: a heading and its blocks; a tip section is a highlighted box. */
export function LessonSectionView({ section, resolved }: { section: LessonSection; resolved: ResolvedExamples }) {
  const blocks = section.blocks.map((b, i) => <Block key={i} block={b} resolved={resolved} />);
  if (section.tip) {
    return (
      <section className="mb-8 space-y-2 rounded-2xl border border-line bg-accent-wash px-4 py-3 text-sm text-accent-text">
        <h2 className="text-sm font-semibold">{section.heading}</h2>
        {blocks}
      </section>
    );
  }
  return (
    <section className="mb-8 space-y-3 text-sm leading-relaxed text-ink">
      <h2 className="text-base font-semibold text-ink">{section.heading}</h2>
      {blocks}
    </section>
  );
}
