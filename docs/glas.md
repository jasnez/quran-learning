# Glas aplikacije Elif

Vodič za sve tekstove u aplikaciji: dugmad, poruke, greške, opise i naslove. Izvor su vodič za glas
iz dizajn sistema "Tezhib" i copy deck "Tekstovi u aplikaciji za učenje Kur'ana" (oba odobrena
19. novembra 2026). Test `src/components/__tests__/copyRules.test.ts` čuva pravila koja se mogu
provjeriti automatski.

## Ko govori i kome

- Aplikacija se obraća sa "ti", toplo i s poštovanjem, kao muallim koji vjeruje učeniku:
  "Uči ajet po ajet", "Nastavi", "Provjeri internet i pokušaj ponovo."
- Bez roda: sadašnje vrijeme i imenice. "Lekcija je savladana.", nikad "Savladao/la si" ni
  "gdje si stao".
- Gdje rečenica može bez obraćanja, piše se bez obraćanja: "Sura je završena. Mašallah!"
- Nikad "Vi" (ni "Vas", "Vam", "Vaš", ni množina: "Pokušajte", "Provjerite").
- Nikad bezlična uputa ("Treba provjeriti internet"): uputa je imperativ jednine.
- Aplikacija ne govori u prvom licu. "Mi" samo na stranicama O aplikaciji i Kontakt.
- Ime aplikacije je "Elif" i dolazi samo iz `SITE_NAME` (`src/lib/site.ts`).

## Islamski izrazi

- "Selam!" u pozdravu na početnoj; "Mašallah!" kad se lekcija savlada ili sura završi.
- Nigdje drugdje: nikad u greškama i nikad kao ukras.
- To su i jedini uzvičnici u aplikaciji.

## Obrasci

| Gdje | Pravilo | Primjer |
|---|---|---|
| Dugme | Glagol i predmet, imperativ jednine | Uči ajet po ajet; Sačuvaj 12. ajet |
| Potvrda | Isti glagol kao dugme, s brojem ajeta | 12. ajet je sačuvan. |
| Greška | Šta se desilo, pa šta uraditi; bez izvinjenja, kod greške tek na kraju | Sura se nije učitala. Provjeri internet i pokušaj ponovo. |
| Prazno stanje | Zašto je prazno i jedna radnja | Još nema sačuvanih ajeta. Dok čitaš, dodirni ikonu za čuvanje pored ajeta. |
| Brisanje | Pitanje s predmetom, posljedica, dugmad glagolima | Ukloniti 12. ajet iz sačuvanih? Bilješka uz njega se briše. |
| Broj uz imenicu | Množina preko `src/lib/format.ts`, ili oznaka pa broj | 31 ajet; Započete sure: 5 |
| Vrijeme | Relativno vrijeme preko `src/lib/format.ts` | prije 1 sat; jučer |
| Decimale i hiljade | Preko `src/lib/format.ts` | 0,75×; 30 od 6.236 |
| Dugme sa stanjem | Ime kaže stanje, isto vidljivo i za čitač ekrana | Ponavljanje: sura |
| Ime za čitač ekrana | Sadrži vidljivi tekst i predmet | Pusti 12. ajet |
| Uputa u polju | Primjer, bez tri tačke | npr. milost, jasin ili 2:255 |
| Interpunkcija | Bosanski navodnici (u JSX-u `&bdquo;` i `&ldquo;`), bez strelica, znaka + i emojija u tekstu, bez velikih slova preko CSS-a | Sve dove iz Kur'ana; Nastavi |

Brojeve i vrijeme nikad ne formatiraj direktno sa `Intl` i jezikom "bs": Chrome i Edge tvrde da
podržavaju bosanski, a formatiraju bez bosanskih podataka ("6,236", "-3 h"). Pomoćne funkcije u
`src/lib/format.ts` to zaobilaze; svaku novu upotrebu provjeri u pravom Chromiumu.

## Rječnik

Jedna riječ za jednu stvar, ista na svakom ekranu.

| Pišemo | Ne pišemo | Zašto |
|---|---|---|
| aplikacija | platforma | Korisnik otvara aplikaciju; "platforma" zvuči kao poslovni plan. |
| sačuvani ajeti, sačuvaj, ukloni iz sačuvanih | označeni ajeti, označi, oznaka, bookmark | "Označiti" već znači isticanje uz zvuk. |
| praćenje riječi, istaknut ajet | označavanje riječi, označavanje ajeta | Isti razlog. |
| preuzeti, preuzete sure, bez interneta | offline, spremljeno, sačuvane sure | "Sačuvati" ostaje samo za ajete. |
| učenje, učač, snimak, zvuk | recitacija, recitator, audio, player | Naše riječi. Gdje bi "učenje" značilo i funkciju Učenje, piše se "snimak" ili "učač". |
| Učenje; dugme "Uči ajet po ajet" | režim učenja, način učenja, fokusirano učenje | Ista funkcija ima jedno ime. |
| transkripcija | transliteracija | Sistem "specijal" bilježi izgovor, a to je transkripcija. |
| medd, gunne, ihfa, kalkala | Mad, Ghunnah, Ikhfa, Qalqalah | Bosanski oblici. |
| tedžvid | tajwid | Bosanski oblik (u kodu i URL-ovima `tajwid` ostaje). |
| Hartija | Sepia | Naziv teme; vrijednost `sepia` u kodu i u sačuvanim postavkama ostaje. |
| slova; Moderno i Klasično pismo | font, Naskh, Scheherazade | Korisnik ne zna nazive fontova. |
| dodirni, ili sam glagol (izaberi, otvori) | klik, tapni | Na telefonu se ne klikće, a "tapni" je anglizam. |
| Sve sure | Lista sura, Pregled sura | Jedno ime za isti spisak. |
| Nezapočete, Nedavno otvorene | Nepočete, Zadnji pristup | Obične riječi umjesto tehničkih. |
| kur'anske dove, dove iz Kur'ana | Kur'anske dove usred rečenice | Pridjev na -ski piše se malim slovom. |
| s kratkim surama | sa kratkim surama | "Sa" samo ispred s, z, š, ž i "mnom". |
| rekat | rekija | "u svakom rekatu namaza". |
| Allahova jednoća (tevhid) | Jednost Boga | Uobičajen izraz. |

Napomena: copy deck za pismo predlaže "Osnovno / Klasično", a predaja dizajna "Moderno / Klasično";
aplikacija od faze 2 koristi "Moderno" i "Klasično" (handoff "Tezhib u kodu").

## Šta test ne vidi

Test hvata "Vi" oblike, bezlične upute, rodne oblike sa "/la", staro ime aplikacije, emojije,
strelice, "platforma", "transliteracija" i engleske nazive pravila. Ne vidi ton, dužinu rečenice ni
da li dugme i potvrda koriste isti glagol: to provjerava čovjek pri pregledu.

Tekstovi lekcija tedžvida (`src/data/tajwid-lessons`) nisu dio ovog prolaza: prepisuju se u fazi 3,
uz pregled muallima.
