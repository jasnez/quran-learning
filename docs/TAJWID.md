# Tajwid u aplikaciji

## Kako je zamisljeno

1. **Postavke → Prikaz → „Tajwid boje”**  
   Uključuje/isključuje obojenje arapskog teksta prema pravilima izgovora. Kada je uključeno, svaki *segment* teksta može imati jednu od boja: normalan tekst, mad (duljenje), ghunnah, ikhfa, qalqalah (vidi legendu u postavkama).

2. **Podaci po ajetu**  
   Za svaki ajet u podacima postoji niz `tajwidSegments`:  
   `[{ "text": "…", "rule": "normal" | "mad" | "ghunnah" | "ikhfa" | "qalqalah" }, …]`.  
   Aplikacija prikazuje svaki segment u boji koja odgovara `rule` samo ako je u Postavkama uključeno „Tajwid boje”.

3. **Audio**  
   Reprodukcija audio zapisa **nije** povezana s prikazom tajwid pravila. Audio samo pušta ajet; nema „highlighta” trenutne riječi tijekom puštanja. Tajwid boje su statične – ovise isključivo o tome što je u `tajwidSegments` za taj ajet.

## Zašto na produkciji ne vidite obojena pravila

- **Lokalni JSON** (sure 1, 112, 113, 114): svaki ajet ima samo jedan segment s `"rule": "normal"`, dakle cijeli ajet je prikazan uobičajenom bojom – nema mad/ghunnah/ikhfa/qalqalah.
- **API** (sure 2–111): `tajwidSegments` je prazan niz; u kodu se koristi fallback: jedan segment = cijeli arapski tekst + `"normal"`.  
Zbog toga **nigdje** u aplikaciji trenutno nema „pravih” tajwid anotacija (samo „normal”), pa se nikad ne prikazuju druge boje, čak ni kada je „Tajwid boje” uključeno.

## Što treba za prikaz pravila

Potreban je **izvor tajwid anotacija** po ajetu (ili po riječi):

- Ručno ili skriptom popuniti `tajwidSegments` u lokalnim JSON fajlovima (razbiti tekst na segmente i dodati `rule` za mad, ghunnah, ikhfa, qalqalah), **ili**
- Koristiti eksterni API/datoteku koji za svaki ajet vraća segmentirane podatke (npr. Tanzil XML s tajwid markupom, ako postoji sličan API u JSON obliku), pa ih mapirati u `tajwidSegments` u `fetch-verses` ili u podacima.

Dok takvi podaci nisu uključeni, „Tajwid boje” i legenda objašnjavaju što bi koja boja značila, ali će cijeli tekst i dalje biti prikazan kao „normalan”.
