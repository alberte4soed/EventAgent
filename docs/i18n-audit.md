# i18n audit — what still needs translating

_Generated 2026-07-19. The app localizes via `t('<Danish source string>')`
(see `src/kalas/i18n.tsx`): Danish is the source language, other languages are
dictionaries in `src/kalas/strings.ts`. A string is only bilingual if it is
wrapped in `t(...)`. Everything below is rendered as a hardcoded literal and is
**not** wrapped, so it shows in Danish (or English) regardless of the chosen
language._

## Summary

- **Done (fully bilingual):** Home, Onboarding, Ava chat, Shell/nav, Registry,
  the public wedding site, the guided tour, and the whole **per-vendor outreach
  feature** (contact dialog + vendor shortlist cards).
- **Not done:** the screens listed below — ~330 strings across the in-app
  screens, plus the marketing site and a few server-side AI branches. This is
  pre-existing; most of these screens were never wired to `t()`.
- The i18n system itself is now **N-language ready** (was hard-coded da/en).
  Adding a third language is a config change — see the recipe at the bottom.

## How to translate one file (the mechanical recipe)

1. `import { useLang } from '...'/i18n'` and `const { t } = useLang();` inside
   the component (each sub-component that renders text needs its own `t`).
2. Wrap every user-facing literal: `>Book<` → `>{t('Book')}<`; attributes too:
   `aria-label="Luk"` → `aria-label={t('Luk')}`.
3. For interpolation use named params: `t('Skrevet på {sprog}', { sprog })`.
4. Add each Danish source string to `EN` in `src/kalas/strings.ts` with its
   English value. **Keys must be unique** — a duplicate key is a build error
   (`tsc` TS1117). Grep before adding.
5. `npm test` (there is now an `i18n.test.ts`) + `npm run build`.

---

### Vendor hub / outreach loop (adjacent to what we built)

**`kalas/screens/Inbox.tsx`** — ~18 strings
- Afvis
- Ava skriver på jeres vegne fra én central postkasse. Her ser I hvem hun har
          kontaktet, hvad de svarer, og godkender hendes svar før de sendes.
- Avas foreslåede svar
- Bed Ava tage kontakt
- Booket
- Booket 🎉
- Generér igen
- Hele svaret
- Ingen filer endnu — menuer, tilbud og billeder fra leverandører samles her.
- Ingen henvendelser endnu
- Ingen leverandører på listen endnu — like nogen, så samler Ava tilbuddene her.
- Intet svar endnu.
- Jeres valg 🎉
- Når Ava skriver til venues og leverandører, samles alle samtaler, tilbud og
          filer her — så I har ét sted til al koordinering.
- Promise
- Tal med Ava
- Tilbage
- Vælg en leverandør for at se samtalen, deres svar og filer. Ava
                    forbereder et svar til hvert svar, som I godkender.

**`kalas/screens/team/BookedPanel.tsx`** — ~5 strings
- Booket ✓
- Booket? Tilføj her
- Find fotograf →
- Hold styr på hele holdet ét sted — fra venue til fotograf og blomster.
- Se detaljer

**`kalas/screens/Venues.tsx`** — ~88 strings
- Alle på listen er allerede kontaktet.
- Alt om stedet samles her. Næste skridt: fotograf og catering.
- Alt om stedet samles nu på jeres oversigt.
- Annuller
- Ava forbereder en personlig henvendelse og sender den på jeres vegne.
- Ava har kontaktet stedet
- Ava har kontaktet venuet
- Ava kender jeres profil og kan sammenligne venues, tjekke datoer og skrive henvendelser for jer.
- Ava kunne ikke hente info automatisk. Tryk
- Ava pick
- Ava researcher venueet — søger på nettet og udfylder kapacitet, priser og praktisk info fra stedets egne sider…
- Ava sender en personlig mail til hvert sted fra jeres Kalas-postkasse og samler alle svar under Henvendelser. I godkender her — intet sendes uden.
- Ava skriver udkastet…
- Ava tilpasser hver mail til det enkelte venue før afsendelse.
- Avas briefing
- Avas udkast
- Bedømmelse
- Besked
- Booket
- Byg jeres liste af venues
- Derfor matcher det jer
- Destination
- Drej på kloden og vælg et land, eller skriv selv et sted — Ava researcher rigtige venues, som I kan gå på opdagelse i nedenfor.
- Emne
- Faciliteter & fordele
- Find flere som disse
- Find fotograf →
- Flere fra jeres liste
- Forstør billede
- Fra opdagelse til det endelige ja — her er jeres overblik og de næste skridt.
- Fra venueets egne sider — bekræft altid pris og dato direkte.
- Ingen forslag i denne kategori.
- Ingen venue valgt endnu
- Ingen venues endnu
- Ingen venues på listen endnu
- Ingen venues tilbage her — prøv et andet sted.
- Jeres noter
- Jeres venue
- Kapacitet
- Klik på et venue for at se billederne, eller tilføj det til jeres liste.
- Kontakt via Ava
- Kunne ikke finde venues her.
- Mest valgt
- Modtagere
- Planlægning
- Praktisk info
- Pris
- Pris fra
- Priser & pakker
- Promise
- Prøv igen
- Rediger liste →
- Rediger med Ava
- Research venue
- Sammenlign det der betyder noget — pris, kapacitet, noter og mere.
- Se detaljer
- Se venue
- Se venues
- Side om
- Skriv noter om dette venue — spørgsmål, mavefornemmelser, hvad I vil spørge om til visning…
- Skriv selv
- Spørg Ava
- Start i Opdag og tilføj de steder I bliver forelsket i.
- Sådan gør I
- Søg
- Tal med Ava
- Tilbage
- Tilbage til listen
- Trin 1 · Opdag
- Trin 2 · Jeres liste
- Trin 3 · Godkend
- Tryk på et land på kloden — eller skriv selv et sted — for at se byer og bryllupsdestinationer.
- Udforsk flere venues
- Udforsk kloden
- Udforsk venues
- Valgt
- Valgt venue
- Venues
- Venues I
- Viser venues
- Vælg
- Vælg land og by på kloden — Ava researcher rigtige venues.
- Vælg som jeres venue
- f.eks. Sydfyn · Toscana · jeres sommerhusby
- flere på listen
- for at prøve igen.
- overvejer.
- side

### Planning screens

**`kalas/screens/Guests.tsx`** — ~38 strings
- Annuller
- Ava sender en venlig påmindelse på jeres vegne
- Besked
- Email
- Email (valgfri)
- Emne
- Emne...
- Gem gæst
- Gem kontakt
- Gæstens email
- Gæstens navn
- Gæstens navn…
- Gæstens telefon
- Har svaret
- Importér
- Kladde
- Klik for at skifte svar
- Kopiér personligt svar-link
- Luk
- Modtagere
- Måltid
- Navn
- Ny besked
- RSVP
- Rediger email & telefon
- Ryd søgning
- Send
- Send nu
- Send påmindelser
- Skabeloner
- Skriv din besked her...
- Søg gæster
- Søg i gæstelisten…
- Telefon
- Telefon (valgfri)
- Tilføj
- Tilføj gæst
- void; onSave: (patch: Partial

**`kalas/screens/Budget.tsx`** — ~16 strings
- 20000 ? 'bg-sage-tint text-ink' : diff
- Antal gæster
- Ava anbefaler
- Betalingstidslinje
- Betalt indtil videre:
- Budget estimeret
- Fordel budgettet automatisk
- Fordelingen lander i kategorierne nedenfor — I kan justere alt bagefter.
- Hvornår skal
- Kategorinavn, fx. Transport
- Næste
- Omdøb kategori
- Samlet budget
- Tilføj
- Tilføj kategori
- · Ava advarer, hvis I rammer loftet.

**`kalas/screens/Seating.tsx`** — ~18 strings
- BRUDEBORDET
- Borde
- DANSEGULV
- Del med venue
- Fjern bord
- Form
- Fuld
- Gæsteliste
- INDGANG
- Klik for at vælge · træk for at flytte bordet
- Placeret
- Sæder
- Tilføj bord
- Total kapacitet
- Uplacerede
- Vælg bordform og kapacitet — tilføj borde efter behov, og placer jeres gæster
          ved at vælge et bord og klikke på gæsterne nedenfor.
- er fuldt —
                  vælg et andet bord ovenfor
- void;
  positions: Record

**`kalas/screens/Planning.tsx`** — ~11 strings
- Annuller
- Dato for ny milepæl
- Gem
- Gem milepæl
- Indsæt under
- Milepælens navn…
- Navn på ny milepæl
- Ryd søgning
- Slet milepæl
- Søg i milepæle
- Tilføj milepæl

**`kalas/screens/Suppliers.tsx`** — ~13 strings
- &ldquo;Hvad skal vi booke og hvornår?&rdquo;
- Ava kender jeres dato, region, budget og stil og giver et personligt svar.
- Bed Ava finde leverandører
- Hvad vil I
- Når I har låst jeres venue, åbner vi leverandørerne — så kan Ava finde og kontakte dem for jer.
- Ofte stillede spørgsmål
- Ryd filter
- Spørg Ava om leverandørerne
- Søg leverandører, stil eller kategori…
- Tal med Ava
- Til venues
- Vælg jeres lokation først
- Vælg jeres lokation, så finder Ava leverandører der matcher.

**`kalas/screens/Invites.tsx`** — ~22 strings
- Behandler…
- Byg fra bunden
- Del invitationen
- Download som PDF
- Farvepalette
- Fem designs sat med jeres navne og dato. Vælg det der føles rigtigt —
            alt kan tilpasses bagefter.
- Forhåndsvisning
- Format
- Indlæser…
- Invitation Studio
- Justering
- Komposition
- Overrask mig
- Program for dagen
- RSVP senest 1. august
- Rediger tekst
- Send
- Tilpas dette design →
- Tilpas palette, typografi og motiv — kortet opdateres live til højre.
- Typografi
- — svar, menu og overnatning
- ← Alle designs

### Website builder

**`kalas/screens/Website.tsx`** — ~94 strings
- .kalas.dk
- AI-billede
- Adgangskode
- Adresse
- Afstand
- Alle almindelige billedformater — også direkte fra iPhone
- Altid
- Anbefalede hoteller
- Anna & Emil
- Ava genererer billeder til sektionerne, henter jeres venue-fotos og bygger hele siden ud fra skabelonen.
- Ava gør arbejdet for jer.
- Ava gør arbejdet.
- Ava har skrevet et udkast — tilpas det som I ønsker.
- Ava læser dette når hun personaliserer eller designer forfra.
- Ava tilføjer automatisk et kort-link til gæsterne.
- Beskriv dresscode og ønsker…
- Branding fjernes når I låser Ava-designeren op
- Brug som forsidebillede
- Del med gæsterne
- Domæne
- Dresscode-tekst
- Et diskret &quot;Lavet med Kalas&quot; vises i bunden af jeres side — og hjælper andre par finde Kalas.
- Forhåndsvisning af jeres side
- Forside
- Fortæl Ava hvad der skal ændres
- Fortæl gæsterne jeres historie…
- Fra jeres profil · redigér under Indstillinger
- Gæsterne får en knap til at uploade egne billeder. Alle billeder samles i jeres private galleri.
- Gæsterne skal indtaste en kode for at se siden.
- Hotelnavn
- Ingen ønskeliste, bryllupsrejse, eller link til registrering…
- Inkluderet i køb
- Jeres design
- Jeres historie
- Jeres side er tilgængelig på denne adresse.
- Justér
- Kalas-branding
- Kom og fejr dagen med os
- Kun bogstaver, tal og bindestreger.
- Lad Ava designe helt forfra
- Live forhåndsvisning
- Lås Ava-designeren op
- Navne
- Nedtælling til brylluppet
- Nej tak
- Otte gennemarbejdede skabeloner
- Planlæg jeres bryllup.
- Planlægger I selv bryllup?
- Pris
- Programpunkt
- Programpunkter
- Promise
- Prøv Kalas gratis →
- Publicering
- Publicering & indstillinger
- Publicér siden for at se statistik
- QR-kode
- RSVP-deadline
- Se live ↗
- Sektioner
- Send linket i invitationen eller print QR-koden.
- Skabelonerne er jeres — men Avas personalisering og ændringer via chat er en betalt funktion. Inkl. fjernelse af Kalas-branding.
- Skift skabelon
- Slet billede
- Spørgsmål & svar
- Spørgsmål…
- Start forfra
- Start gratis — ingen kreditkort
- Starter forfra…
- Statistik
- Sted / detalje (valgfrit)
- Svar synkroniseres automatisk med jeres gæsteliste.
- Svar…
- Tak for dit svar!
- Tekst til gæsterne
- Tidslinje, venues, budget og bryllupsside på én platform.
- Tilføj hotel
- Tilføj programpunkt
- Tilføj spørgsmål
- Trin 1 · Vælg jeres stil
- Træk billeder herind eller tryk upload — forlovelsesbilleder, stedet, jer to. Ava designer ud fra dem. Markér ét som forsidebillede.
- Tænd/sluk sektioner og rediger indholdet. Siden opdateres til højre.
- Upload
- Upload-link:
- Velkomstbesked
- Venue-navn, adresse, postnummer
- Vælg billeder til galleriet
- Vælg den der ligner jer — siden skifter med det samme i forhåndsvisningen. Bagefter gør Ava den personlig med jeres billeder, og I kan bede hende om ændringer.
- Vælg en kode til gæsterne
- f.eks. Vi drømmer om noget let og botanisk med varme toner — ikke for stift…
- f.eks. mere romantisk, mørkere, større billeder…
- Én gang · 499 kr ved launch · normalt 799 kr
- Ønskeliste-link (valgfrit)
- ● Siden er live

### Chrome / small components

**`kalas/PalettePicker.tsx`** — ~3 strings
- + Egne farver
- Nulstil ×
- Tilpas dine 5 farver

**`kalas/OnboardingHint.tsx`** — ~1 strings
- Luk guide

**`kalas/onboarding/Lightbox.tsx`** — ~3 strings
- Forrige
- Luk
- Næste

**`kalas/onboarding/WeddingDatePicker.tsx`** — ~1 strings
- = [];
    for (let i = 0; i

**Total in-app: ~331 strings across 14 files**

---

## Other surfaces — decide whether they are in scope

These are **not** in the ~330 in-app total above because they may be
intentionally single-language.

- **Marketing / landing site** (`src/components/landing/*`, 19 files, ~55
  strings; plus `src/app/login/page.tsx`). The public homepage. Often kept in
  one language deliberately. Separate decision from the in-app product.
- **Settings & auth chrome** (`src/app/settings/page.tsx` ~14 strings,
  `src/app/w/[slug]/page.tsx`). Note: the settings page is currently written in
  **English** literals and is a server component outside the `t()` system — it
  would need either wrapping or a rewrite to Danish-source.

## Server-side language branches (matter when adding a 3rd language)

These routes generate AI content and currently branch binary Danish/English.
Adding a language means giving each a real per-language prompt, not a ternary:

- `src/app/api/chat/route.ts` — Ava's system prompt language.
- `src/app/api/onboarding/route.ts`
- `src/app/api/onboarding/destinations/route.ts`
- `src/app/api/onboarding/venues/route.ts`

(The *vendor outreach* email language is separate and already scales to 25
languages via `src/lib/venue/language.ts` — unaffected by the app-UI language.)

## Adding a new UI language (now a config change)

1. Add the code to `APP_LANGUAGES` in `src/lib/db/types.ts`
   (e.g. `["da", "en", "de"]`).
2. Add a dictionary + label row to `LANGUAGES` in `src/kalas/i18n.tsx`:
   `{ code: 'de', label: 'Deutsch', dict: DE }`, with `DE` in `strings.ts`
   mapping the Danish source strings to German.
3. That's it — `translate()`, both language switches, and the stored-preference
   guard all read the registry. The Supabase `profiles.language` column is text,
   so no migration is needed.

Caveat: the server-side AI branches above still need per-language prompts, and
every screen in this audit must actually be wrapped in `t()` first — the
registry makes the *plumbing* N-ready, not the *coverage*.
