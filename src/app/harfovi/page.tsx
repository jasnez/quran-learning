import type { Metadata } from "next";
import Link from "next/link";
import { ARABIC_LETTERS, ARABIC_VOWELS, LETTER_RULES_SOURCE } from "@/lib/letters/data";

export const metadata: Metadata = {
  title: "Harfovi i izgovor | Quran Learning",
  description:
    "Tabela arapskih harfova: kako se pišu u transkripciji po Pravilima Islamske zajednice u Bosni i Hercegovini i kako se izgovaraju.",
};

const LINK = "text-[var(--theme-accent)] underline hover:no-underline dark:text-emerald-400";
const H2 = "mt-10 text-lg font-medium text-[var(--theme-text)]";

export default function LettersPage() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-16 md:py-12">
      <article className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--theme-text)] md:text-3xl">Harfovi i izgovor</h1>
        <p className="max-w-[65ch] leading-relaxed text-stone-600 dark:text-stone-400">
          Transkripcija ajeta i dova u aplikaciji pisana je sistemom koji Pravila Islamske zajednice zovu
          &bdquo;specijal&ldquo; i preporučuju za učenje kur&apos;anskog teksta. Tabela pokazuje kako se svaki harf piše
          u tom sistemu, kako u druga dva sistema iz istih Pravila, i kako se izgovara.
        </p>

        {/* A scrollable region needs a name and keyboard focus so that it can be scrolled without a mouse. */}
        <div className="letter-table-region mt-8" role="region" aria-labelledby="letters-caption" tabIndex={0}>
          <table className="letter-table">
            <caption id="letters-caption">Arapski harfovi: pisanje u tri sistema i izgovor</caption>
            <thead>
              <tr>
                <th scope="col">Harf</th>
                <th scope="col">U aplikaciji (specijal)</th>
                <th scope="col">Opća transkripcija</th>
                <th scope="col">Naučna (DMG)</th>
                <th scope="col">Izgovor</th>
              </tr>
            </thead>
            <tbody>
              {ARABIC_LETTERS.map((letter) => (
                <tr key={letter.arabic}>
                  <th scope="row">
                    <span className="font-arabic letter-glyph" lang="ar" dir="rtl">
                      {letter.arabic}
                    </span>{" "}
                    <span>{letter.name}</span>
                  </th>
                  <td data-label="U aplikaciji" className="letter-sign">
                    {letter.special}
                  </td>
                  <td data-label="Opća" className="letter-sign">
                    {letter.general}
                  </td>
                  <td data-label="Naučna (DMG)" className="letter-sign">
                    {letter.dmg}
                  </td>
                  <td data-label="Izgovor">{letter.pronunciation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={H2}>Vokali</h2>
        <div className="letter-table-region mt-4" role="region" aria-labelledby="vowels-caption" tabIndex={0}>
          <table className="letter-table">
            <caption id="vowels-caption">Kratki i dugi vokali, prikazani na harfu ba</caption>
            <thead>
              <tr>
                <th scope="col">Znak</th>
                <th scope="col">U aplikaciji (specijal)</th>
                <th scope="col">Opća transkripcija</th>
                <th scope="col">Naučna (DMG)</th>
              </tr>
            </thead>
            <tbody>
              {ARABIC_VOWELS.map((vowel) => (
                <tr key={vowel.name}>
                  <th scope="row">
                    <span className="font-arabic letter-glyph" lang="ar" dir="rtl">
                      {vowel.arabic}
                    </span>{" "}
                    <span>{vowel.name}</span>
                  </th>
                  <td data-label="U aplikaciji" className="letter-sign">
                    {vowel.special}
                  </td>
                  <td data-label="Opća" className="letter-sign">
                    {vowel.general}
                  </td>
                  <td data-label="Naučna (DMG)" className="letter-sign">
                    {vowel.dmg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className={H2}>Kako čitati transkripciju</h2>
        <ul className="mt-3 max-w-[65ch] list-disc space-y-2 pl-5 leading-relaxed text-stone-600 dark:text-stone-400">
          <li>
            <strong>Dugi vokali</strong> imaju crticu iznad slova (ā, ī, ū) i izgovaraju se dvostruko duže od kratkih.
          </li>
          <li>
            <strong>Fetha</strong> se piše <em>a</em> uz krupne i grlene harfove (ḥ, ḫ, ʻ, g, q, ṣ, ḍ, ṭ, ẓ), a inače{" "}
            <em>e</em>: <em>el-ḥamdu</em>, ali <em>we lem jelid</em>.
          </li>
          <li>
            <strong>Tešdid</strong>: udvojen harf piše se dva puta i izgovara pojačano, npr. <em>rabb</em>, <em>Allāh</em>.
          </li>
          <li>
            <strong>ʻ i ʼ</strong> nisu isti znak: ʻ je &apos;ajn (<em>ʻilm</em>), a ʼ je hemze (<em>Qurʼān</em>). Hemze
            se na početku riječi ne piše.
          </li>
          <li>
            <strong>Određeni član</strong> veže se crticom za prethodnu riječ: <em>rabbil-ʻālemīn</em>. Ispred sunčevih
            harfova čita se taj harf: <em>jewmid-dīn</em>.
          </li>
          <li>
            <strong>Kraj ajeta</strong> napisan je onako kako se čita kad se stane: <em>nesteʻīn</em>,{" "}
            <em>el-qāriʻah</em>. Unutar ajeta riječi su napisane kako se čitaju u spoju.
          </li>
          <li>
            <strong>Idgam i iklab</strong> se ne pišu: piše se <em>min baʻdi</em>, a uči po pravilima tedžvida.
          </li>
        </ul>

        <h2 className={H2}>Izvor</h2>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-stone-600 dark:text-stone-400">
          Znakovi u tabeli preuzeti su iz dokumenta{" "}
          <a href={LETTER_RULES_SOURCE.url} target="_blank" rel="noopener noreferrer" className={LINK}>
            {LETTER_RULES_SOURCE.title}
          </a>{" "}
          ({LETTER_RULES_SOURCE.publisher}). Nazivi harfova i opisi izgovora su objašnjenja ove aplikacije i nisu dio
          Pravila.
        </p>
        <p className="mt-3 max-w-[65ch] leading-relaxed text-stone-600 dark:text-stone-400">
          Transkripcija je napravljena pravilima iz arapskog teksta. Za sure čiji tekst Pravila ne donose, izbor
          između <em>e</em> i <em>a</em> slijedi pravilo izvedeno iz teksta koji Pravila donose. Greške se prijavljuju na stranici{" "}
          <Link href="/contact" className={LINK}>
            Kontakt
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
