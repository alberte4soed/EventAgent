# Indholds- og produktionsplan — Kalas

**Hvad der skal laves for at markedsføre Kalas, og i hvilken rækkefølge.**
Udarbejdet af marketingteamet (video, karrusel, copy, vækst og aktiver) 14. august 2026.
Strategien ligger i [`some-strategi.md`](./some-strategi.md) — dette dokument er produktionen.

Præmis: **nul markedsføringsbudget, én person med ca. 6 timer om ugen, ingen fotograf,
ingen skuespillere.** Men der er udviklingskapacitet. Det er den vigtigste asymmetri i
hele planen: **når vi ikke har penge, skal marketingarbejde omsættes til kodearbejde,
hver gang det kan lade sig gøre.** En PDF skal vedligeholdes manuelt for evigt. En
genereret side koster én dev-dag og derefter nul.

---

## 0. De ti ting der laves først

Rækkefølgen er bindende — hver ting gør den næste billigere.

| # | Opgave | Dev | Mkt |
|---|---|---|---|
| 1 | **Gør sidefoden på bryllupshjemmesiden klikbar** | 3 t | 20 min |
| 2 | **Byg attributionskæden** (`growth_events`, første+sidste berøring) | 1 dag | 1 t |
| 3 | UTM-register + Umami sat op | — | 3 t |
| 4 | **Send spørgeskemaet ud** | — | 3 t |
| 5 | Lead magnet 1: "Mailen, der får venues til at svare" | — | 4 t |
| 6 | **Ret Ava's mailsignatur** (afsender, emnelinje, AI-oplysning, framelding) | 4 t | 30 min |
| 7 | Venteliste med ægte knaphed + henvisning | 1 dag | 2 t |
| 8 | MailerLite + velkomstmail 1-2 | — | 4 t |
| 9 | OG-billedgenerator (`next/og`) | 1,5 dag | 1 t |
| 10 | Leverandørside + "Sådan skriver Ava til jer" + framelding | 1,5 dag | 5 t |

**I alt 24 marketingtimer og 8 udviklingsdage.**

**Nr. 4 skal gøres først.** De øvrige ni kan flyttes en uge uden konsekvens.
Spørgeskemaet kan ikke — hver uges forsinkelse koster ca. 40 besvarelser, og
undersøgelsen er hele PR-planen.

---

## 1. Tre ting i koden, der allerede er halvt bygget

Verificeret i repoet 14. august 2026.

### 1.1 Sidefoden er ikke et link

`src/kalas/site/SiteRenderer.tsx:252-253` — "Lavet med" og "Kalas" står som to `<span>`.
Ingen `<a>`. Distributionsfladen er bygget og ikke tilsluttet.

Samme sidefod findes i `src/app/w/[slug]/PublicSite.tsx:155`. Fire gæstevendte ruter
findes allerede og linker ingen af dem tilbage:

```
/w/[slug]        bryllupshjemmesiden
/w/[slug]/del    gæste-upload
/w/[slug]/tak    tak-siden
/i/[slug]        invitationen
```

**Retningen:** `<a href="/til-gaester?utm_source=wedding_site&utm_medium=referral_product
&utm_campaign=footer">Lavet med Kalas</a>` — serif, 0,9rem, salvie, opacity 0.6,
hårfin streg over. Én linje. **Ingen logo, ingen knap, ingen farve.** Den skal ligne et
trykkerimærke bagerst i en bog.

`config.hideBranding` findes allerede (`src/kalas/site/config.ts:101`, default `false`)
— parret kan slå det fra. Det skal det blive ved med at kunne.

**Aldrig byg:** flydende badge, sticky bar, "Lav jeres egen gratis!"-knap, interstitial
før gæsten ser siden, mailindsamling på selve bryllupssiden, retargeting af gæster.
Parret har inviteret sine gæster til sit bryllup, ikke til vores tragt.

### 1.2 Ava-mailen har ingen afsenderidentitet

`src/lib/outreach/brief.ts:63` signerer i dag:

```
Kærlig hilsen
Ava — på vegne af parret
```

Ingen parnavne. Ingen oplysning om at Ava er en AI. Ingen framelding. Ingen
`List-Unsubscribe`. Det er både en tabt kanal og en tillidsrisiko — se afsnit 6.

### 1.3 Emnelinjen kan triageres bedre

I dag: `Forespørgsel: bryllup for 90 gæster lørdag den 14. august 2027`.
Den er faktisk god. Den mangler kun parrets navne, så et venue kan kende afsenderen
igen, når svaret kommer.

---

## 2. Video — 30 Reels

**23 af de 30 kan laves med ren skærmoptagelse og intet andet.** 4 er tekst på ivory,
2 kræver ét enkelt telefonklip hjemmefra.

### 2.1 Hvad en Kalas-Reel skal gøre

Den skal give afsenderen en replik. Ingen sender en video, fordi den er flot — de sender
den, fordi den siger noget, de selv ville have sagt til én bestemt person.

To delingsudløsere, og alt skal ramme én af dem inden for 1,5 sekund:

- **"Det her er os."** Genkendelsen af *arbejdet*: regnearket med 11 faner, de fire
  venues der aldrig svarede, mailen skrevet om syv gange. Det er projektledelsesindhold
  forklædt som bryllupsindhold. Sendes til den anden halvdel af parret.
- **"Se lige hvad den gør."** Et mekanisk chok med synlig før/efter-tilstand: 0 sendte
  mails kl. 21.04 → 6 svar kl. 08.12. Sendes videre som et argument.

**Hvorfor skærmoptagelser kan slå smukke bryllupsbilleder:** bryllupsbilleder er mættet
kategori-tapet og beviser ingenting — et smukt billede fortæller, at dagen blev smuk,
ikke at arbejdet blev gjort. En skærmoptagelse er et bevis med tidsstempel: indbygget
dramaturgi, en hovedperson (cursoren), og en mikroændring hele tiden.
Og vi kan lave otte om ugen i stedet for én om måneden. **Frekvens er en strategi.**

Hvor de ikke kan: de sælger ikke følelsen af dagen og er dårlige save-magneter alene.
Derfor: **skærm driver sends, tekst-på-ivory driver saves, telefonklip driver watch time.**
Normal måned: 70 % skærm, 20 % tekst, 10 % hjem.

**Tre regler i hver eneste video:**
1. Sidste frame beder om en videresendelse, ikke om et køb.
2. Alt der står som overlejring, bliver også **sagt** højt — Instagram indekserer voiceover.
3. Vises en mail blive sendt, vises godkendelsesskærmen først. Uden undtagelse.

### 2.2 De fem der skal ligge klar før lancering

**1. "Hele flowet på 45 sekunder"**
Fra tom chat til fem sendte forespørgsler, ingen klip udenom. Kapitelmarkører nederst:
*1. I skriver · 2. Ava finder · 3. I vælger · 4. I læser · 5. I godkender · 6. Ava sender
· 7. Svarene kommer ind.* Slutkort: **"Syv trin. I bestemmer på trin fem."**
20 min produktion — og **alle andre A-videoer klippes ud af den samme fil.**

**2. "21.04 → 08.12"**
Godkendelsesskærm, uret viser 21.03. Klik. Fem statusser til "Sendt", uret 21.04. Skærmen
dæmpes til sort, en hårfin terrakotta-streg vokser vandret med tidsstempler flyvende forbi
(22.00 · 00.00 · 03.00 · 06.00), tallet "11 timer" vokser. Skærmen tændes: 08.12, tre af
fem har svaret med priser trukket ud. Slutkort: **"I sov. Indbakken arbejdede."**

**3. "Godkendelsesskærmen"**
Mailen i fuld skærm, `{{venue_name}}` markeret i terrakotta. Cursoren scroller, dato,
gæsteantal og budget fremhæves ét ad gangen. Cursoren nærmer sig **Godkend**, stopper
0,8 sek., klikker. Fem statusser skifter. Slutkort: **"I godkender alt."**
*Den forsvarer os. I samme sekund en video om automatiske mails får rækkevidde, kommer
kommentaren "sender den bare noget i mit navn?" — og så skal svaret allerede ligge på
profilen som en video, vi kan linke til.*

**4. "Ava regnede vores budget pr. person. Det var forkert."**
Ava's svar viser en ramme på 13,5 mio. kr. Zoom 150 %. Det står der uden undskyldning.
Parret skriver "Nej — 150.000 i alt. Ikke pr. gæst." Rammen rettes, venue-kortene skiftes
ud. Slutkort: **"Hun tager fejl. Derfor godkender I alt."**
*Ingen andre i kategorien viser deres eget produkt lave en fejl. Det gør alle vores andre
påstande mere troværdige med tilbagevirkende kraft.*

**5. "August 2027 har fire lørdage"**
Kalendervisning, de fire lørdage markeres. Regnestykket skrives ind: 32.624 → × 18,8 %
→ 6.133 → × 70 % → 4.293 → ÷ 4 → **≈ 1.073 bryllupper pr. lørdag.**
Slutkort: **"Datoen er den knappeste ressource I har."**
*Den eneste af de fem, der ikke handler om produktet. Folk deler den, fordi den er
interessant — ikke fordi den er vores.*

**Rækkefølge på profilen ved lancering:** 1, 2, 5, 3, 4 — så den veksler mellem bevis og
redaktionelt.

### 2.3 De syv serier

| Serie | Indhold | Antal | Frekvens |
|---|---|---|---|
| **A · Ava arbejder** | Kernedemoerne: én sætning → seks venues · swipe-bunken · godkendelsesskærmen · placeholderen der bliver til fem navne · dashboardet der opdaterer sig selv · hele flowet · de tre linjer i mailen | 7 | 2/uge |
| **B · Kl. 21 / Kl. 8** | 21.04 → 08.12 · køkkenbordet kl. 21 · notifikationen om morgenen · ugen der gik | 4 | 1 hver 14. dag |
| **C · Den anden side af indbakken** | 30 forespørgsler, én der bliver besvaret · hvorfor de ikke svarede · emnefeltet · 11 timer | 4 | 1 hver 14. dag |
| **D · Regnestykker** | August 2027 har fire lørdage · 745 eller 1.000 · 112.000 til 149.000 · 64,1 % · 33,7 og 35,7 | 5 | 1/uge |
| **E · Ava tager fejl** | Budgettet pr. person · for langt væk · mailen lød ikke som os · kapaciteten passede ikke | 4 | 1 hver 14. dag |
| **F · Udlandet** | Buongiorno · tre sprog, ét klik · svaret kom på spansk | 3 | efter behov |
| **G · Holdning** | Regnearket ("Fanen hedder 'Venues FINAL v4 RIGTIG'") · ting vi ikke siger · fjorten leverandører | 3 | 1/uge, lavenergi |

**Serie C er rekonstruktion.** Vi viser aldrig et rigtigt venues indbakke, navn eller
svartekst. Vi bygger en falsk mailklient med tekster, vi selv har skrevet, og overlejrer
*"Rekonstruktion. Ingen rigtige venues vist."* i frame 1-3.

### 2.4 Optageopskrift

**Før du trykker optag**
- 1080 × 1920, 9:16, 30 fps. Hård speed-ramping → optag i 60 fps.
- **Flytilstand + Forstyr ikke + Guidet adgang.** Én notifikation ødelægger klippet, og
  du opdager det først i klipningen.
- Batteri over 60 % (ikonet skifter farve). Ur sat manuelt, når du skal bruge et bestemt
  tidsstempel.
- Log ind på **demo-kontoen**. Mørk tilstand **fra** — ivory-fladerne er hele æstetikken.
- Ryd faner, skjul bogmærkelinjen. Skærmen skal kun indeholde Kalas.

**Optagelsen**
- **Optag én lang, ubrudt gennemgang.** Alt andet klippes ud af den. Billigere at optage
  én gang i 4 minutter end otte gange i 30 sekunder.
- **Cursoren er hovedpersonen.** Tre hastigheder: *transport* (hurtig, lige linje),
  *nærmen sig* (decelererer de sidste 30 %), *tøven* (helt stille 0,6-0,9 sek. før et
  vigtigt klik). Tøven er den enkeltteknik, der hæver retention mest — den læses som
  beslutning.
- Klik aldrig i samme sekund, du ankommer. Ankom, stop, klik.
- Lav en bevidst pause på 2 sekunder før hver ny sektion. Det giver rene klippepunkter.

**Værktøjer, alle gratis:** CapCut (klip, hastighed, danske auto-undertekster) ·
OBS Studio (skærmoptagelse på computer) · Canva (ivory-tekstframes) · Fraunces fra
Google Fonts, installeret lokalt.

**Klipning**
- Speed-ramping i CapCut: Hastighed → Kurve → Tilpas. Tre punkter: hurtig ind (×6),
  decelerér ind mod handlingen, hold ×1 i 1-1,5 sek. over resultatet. **Aldrig konstant
  hurtigt** — det er fejlen, der får en demo til at ligne en demo.
- Zoom laves i klip, ikke i optagelse. Keyframe 100 % → 130-150 % over 0,4-0,6 sek. med
  ease-out. Kun på tal, statusskift, placeholderen, godkendelsesknappen. Højst tre zooms
  i en video under 25 sek.
- **Skjul persondata ved at bruge demo-data fra start, ikke ved at sløre bagefter.**
  Sløring ser mistænkeligt ud. Skal noget dækkes: læg et hårfint ivory-rektangel over —
  det ligner design, ikke censur.
- Tekst i øverste tredjedel, aldrig i de nederste 250 px (Instagrams UI). Ingen bokse,
  ingen skygger, ingen konturer. **Er teksten ulæselig uden skygge, er baggrunden forkert.**
- Lyd, i prioriteret rækkefølge: din egen voiceover (optaget i et klædeskab eller med en
  pude foran telefonen) → Instagrams eget lydbibliotek valgt **inde i appen ved upload**
  → rå UI-lyd. En video med voiceover og ingen musik slår altid det omvendte, fordi
  voiceoveren også bliver indekseret.

**Fem regler mod kedeligt demomateriale**
1. Vis en tilstandsændring, ikke en funktion. 0 → 5. "Afventer" → "Svar modtaget".
2. Start midt i handlingen. Aldrig et logo, aldrig en forside som første frame.
3. Én pointe per video. Har du to, har du to videoer.
4. **Lad noget gå galt eller mangle.** Perfektion læses som reklame.
5. Slut på et tal eller en sætning, ikke på et logo.

### 2.5 Ventetid som dramaturgi

Produktet er langsomt nogle steder. Det er ikke et problem, der skal skjules — det er
den eneste indbyggede spændingskurve, vi har.

- **Klip på tilstandsændringen, ikke på tiden.** En søgning på 40 sekunder har to
  interessante øjeblikke: starten og det første kort. Resten er ×8.
- **Speed-ramp ind i resultatet, ikke ud af det.** Decelerér de sidste 0,5 sek.
- **Skriv hastigheden på.** "×8" i hårfin tekst nederst. Ærlighedsmarkøren gør, at folk
  tror mere på resten af videoen.
- **Gør ventetiden til en tidslinje.** Sort skærm, en hårfin terrakotta-streg der vokser,
  tidsstempler der flyver forbi. Fem sekunders skærmtid til elleve timers realtid.
- **Sig det højt:** *"Det tog fyrre sekunder. Vi har klippet det ned til tre."*

**Aldrig:** en spinner i realtid uden overlejring, eller at klippe væk og påstå at
resultatet var øjeblikkeligt.

### 2.6 Demo-rollelisten

Samme seks par går igen i alle videoer for altid. Genkendelse på tværs får kontoen til at
ligne et produkt med brugere, uden at vi påstår, at de *er* brugere. Alle datoer er
verificerede lørdage i 2027.

| Par | Region | Dato | Gæster | Budget | Bruges til |
|---|---|---|---|---|---|
| Ida & Mikkel | Nordsjælland | 14. aug. | 90 | 150.000 | Hovedcase. Serie A og B |
| Sofie & Jonas | Aarhus | 5. juni | 60 | 95.000 | Det stramme budget |
| Amalie & Rasmus | Fyn | 11. sep. | 130 | 180.000 | Den store fest, kapacitetsfejlen |
| Line & Kasper | Møn | 22. maj | 45 | 70.000 | Lille bryllup, borgerlig vielse |
| Freja & Oliver | Puglia | 18. sep. | 40 | 140.000 | Hele serie F |
| Maja & Noah | Nordjylland | 3. juli | 110 | 120.000 | Serie E, fejlene |

**Venue-navne:** brug opdigtede navne overalt — *Bregnholm Gods · Kildemose Ladegård ·
Agerlund Have · Fjordholm Pakhus · Stenbæk Kro · Nøddelund Avlsgård*, og til udlandet
*Masseria Cavolino · Tenuta Serralta · Podere Bianconi*. **Google hvert navn før første
brug** og skift det, hvis det viser sig at findes. I svar-visninger, priser og afslag
bruges aldrig et rigtigt venue-navn. Aldrig.

**Mærkning:** videoer med indgående svar bærer *"Demo. Opdigtede venues og priser."* i
mindst 3 sekunder. Videoer med internationale tal siger kilden **højt** og skriver
*(Internationale brancheundersøgelser)* på skærmen.

**Regnereglen for persondata:** indeholder skærmen en liste over navngivne tredjepersoner,
filmer vi den ikke. Gæstelisten filmes aldrig — heller ikke opdigtet, heller ikke sløret.

**Ingen AI-genererede billeder af mennesker, steder, lokaler eller mad. Nogensinde.**
Venue-kortenes billedfelt vises med produktets egen pladsholderflade, eller kortet
beskæres, så billedfeltet ligger uden for framen.

**Demo-mailboks:** opret en separat afsender og fem opdigtede modtageradresser på eget
domæne (`bregnholm@demo.kalas-weddings.com`). Så kan hele svar-flowet køres ægte
end-to-end, uden at ét eneste rigtigt venue nogensinde bliver kontaktet.

### 2.7 Trial Reels — gratis hook-research

> ⚠️ **Rettet 14. august 2026: Trial Reels kræver 1.000 følgere.** De kan ikke bruges fra
> dag ét, som planen oprindeligt sagde. Kør testene nedenfor som **almindelige opslag**
> indtil da — et Reel går alligevel til ikke-følgere i de første 72 timer — og skift til
> Trial Reels, når kontoen passerer 1.000. (Broadcast channels har derimod *intet*
> følgerkrav og kan oprettes med det samme; de to krav stod byttet om.)

Samme video, samme lyd, samme sluttekst. Kun frame 1-teksten og den første talte sætning
ændres. **2 om ugen.** Aflæs 3-sekunders-retention og sends per reach — ikke likes.

| Test | A | B | Afgør |
|---|---|---|---|
| Tal mod følelse | "21.04: fem forespørgsler sendt." | "Vi sov, mens indbakken arbejdede." | Om hooks skal være tidsstempler eller tilstande. Styrer de næste tyve videoer |
| Produkt mod problem | "Et venue får 30-50 forespørgsler om ugen." | "Derfor svarede de fire venues aldrig." | Om vi må åbne med et branchetal |
| Fejl som hook | "Ava regnede vores budget forkert." | "Sådan retter I værktøjet, når det gætter forkert." | Om selvkritik trækker koldt publikum ind. Hele serie E hænger på svaret |
| Dansk mod internationalt tal | "August 2027 har fire lørdage." | "64 % af leverandører bliver ghostet." | Om danske tal slår større internationale |
| Længde | 45-sek. fuld gennemgang | 18-sek. nedklip, samme hook | Hvor mange minutter hver søndag koster |

**Aflæsningsregel:** en vinder skal slå modparten på **sends per reach** og ikke tabe mere
end 10 % på 3-sekunders-retention. En hook med flere likes men færre sends taber.

---

## 3. Karruseller — 20 stk.

Karruseller er vores billigste format og det, der bliver **gemt**. Saves kommer fra
referencemateriale: tjeklister, tabeller, frameworks.

### 3.1 Anatomien — 8 slides, altid

| Slide | Rolle | Maks. ord |
|---|---|---|
| 1 | **Krogen.** Én påstand eller ét tal. Ingen logo, ingen "swipe"-pil. Overskrift i øverste tredjedel — midten dækkes af Instagrams UI ved deling til Stories | 12 |
| 2 | **Indsatsen.** Hvorfor slide 1 koster noget, og hvad læseren får | 30 |
| 3-6 | **Substansen.** Én idé, ét tal, ét punkt pr. slide. Skal kunne stå alene uden slide 1 | 45 |
| 7 | **Broen.** Den eneste produktslide. Én handling, ikke en funktionsliste | 35 |
| 8 | **Gem-sliden.** Den vigtigste efter slide 1 | 55 |

**Gem-sliden beder aldrig om et gem — den gør gemmet nødvendigt.** Hele karrusellen
komprimeret til 4-6 linjer med hårfine streger imellem, og så formlen:

> **"Gem den. I skal bruge den, [når det konkret sker]."**
> *…når I skriver til det første venue. …når det første tilbud lander. …når I sætter jer
> ned med regnearket i januar.*

Vi skriver aldrig "gem til senere" eller "del med en, der skal giftes". Vi tigger ikke.

**Handler karrusellen ikke om noget, Ava faktisk gør, dropper vi slide 7 og laver 7 slides.**
Vi presser hende ikke ind.

**Fast:** `KALAS` i sidefoden på slide 2-8 · progressionsstreger i nederste højre hjørne,
den aktuelle i terrakotta · altid et roligt lydspor på (kan skubbe karrusellen i
Reels-feedet) · søgeord i captionens første sætning · maks. 5 hashtags.

### 3.2 Grid og typografi — 1080×1350

**Marginer:** venstre/højre 96 px · top 120 px · **bund 132 px** (større end toppen, med
vilje — det er det, der får det til at se redaktionelt ud) · tekstbredde 888 px.

**Al lodret afstand skal være et af fem tal: 24 · 36 · 48 · 72 · 120.** Ikke 40. Ikke 55.
Det er hele systemet.

| Element | Skrift | Størrelse | Farve |
|---|---|---|---|
| Eyebrow | Sans, versaler, 0,16 em | 26 px | `#8a9079` |
| Overskrift, slide 1 | Fraunces | 96 px | `#314523` |
| Overskrift, slide 2-8 | Fraunces | 68 px | `#314523` |
| Brødtekst | Sans | 34 px | `#59634f` |
| Stort taltegn | Fraunces | 220 px | `#173c32` |
| Tabelrække-tal | Fraunces | 48 px | `#173c32` |
| Kildelinje | Sans | 22 px | `#8a9992` |

**Kun to skriftstørrelser pr. slide plus eyebrow.** Tre er allerede for meget.
Er I over ordgrænsen, er der en sætning der skal dø — ikke en skriftstørrelse der skal ned.

**Streger:** 1 px. Aldrig 2. `#d8d4c7`, eller `#e4e0d4` når den skal være næsten væk.
**Aldrig:** skygger, gradienter, glød, runde farvede cirkler bag ikoner, ornamenter.

**Terrakotta `#b34e37` er ikke en farve, vi dekorerer med. Det er en markør.**
Maks. ét sted pr. slide, maks. tre slides pr. karrusel. Tilladt: ét ord i en overskrift ·
ét tal i en tabel · en lodret streg ved et citat · den aktive progressionsprik · CTA-pilen.
Forbudt: hele overskrifter, baggrunde, flader over 5 % af sliden.
*Test: knib øjnene sammen. Ser I mere end ét rødt punkt, er der ét for meget.*

**Diagrammer:** vandrette søjler, 36 px høje, ingen akser, ingen gitter, tal skrevet for
enden. **Aldrig cirkeldiagram** — brug en enkelt vandret bjælke delt med 1 px hvide skel.

### 3.3 De 20

**Tal og regnskab (5)**

| # | Titel | Kerne |
|---|---|---|
| 1 | **745 kroner** | Pris pr. gæst ganget op på 60/100/140 gæster. Gem-slide = færdigt regnestykke |
| 2 | **1.073 bryllupper på én dag** | 32.624 → 18,8 % → 70 % lørdag → 4 lørdage. "Det er ikke en dato. Det er en kø" |
| 3 | **130.000 kr. — linje for linje** | Hele budgettet i søjler. Papir og hjemmeside er 1,5 % og tager flest aftener |
| 4 | **64,1 %** | Borgerlige vielser, op fra 53,4 % i 2007. "Danmark har flyttet sig. Bryllupsbranchen har ikke" |
| 5 | **195.744 mails** | 32.624 par × 6 venues. Eget regnestykke, antagelsen skrevet ud på sliden |

**Sådan gør I det (4)**

| # | Titel | Kerne |
|---|---|---|
| 6 | **Rækkefølgen** | 01 dato og venue → 07 kage, transport, papir. "Book nedad. Aldrig opad" |
| 7 | **Otte linjer** | Hvad en venue-forespørgsel skal indeholde. Punkt 08: ét spørgsmål kun de kan svare på |
| 8 | **Sådan læser I et tilbud** | Seks spørgsmål: drikkevarer, personale efter midnat, oprydning, inventar, minimumsforbrug, udløbsdato |
| 9 | **Ni spørgsmål til bryllupsmessen** | Nr. 9 er vigtigst: "Kan I sende det skriftligt i morgen?" Gem-slide: *"Tag et skærmbillede. Der er ikke wi-fi i messehallen"* |

**Leverandørens side (3)**

| # | Titel | Kerne |
|---|---|---|
| 10 | **Derfor svarer de ikke** | Fire grunde, ingen af dem om jer. Internationale tal med kildelinje direkte på sliden |
| 11 | **Hvad der gør en forespørgsel god** | Dårlig mail vs. god mail, side om side. Slide 4 er en færdig mail folk kopierer |
| 12 | **Hvad venuet kigger efter** | "I søger ikke om en dato. I forhandler om den" |

**Produkt (3)**

| # | Titel | Kerne |
|---|---|---|
| 13 | **Hvad Ava gør** | De seks trin. "I tager beslutningerne. Hun tager mailene" |
| 14 | **Hvad Ava ikke gør** | Fem grænser. "En agent, der gør færre ting, kan gøre dem ordentligt" |
| 15 | **Hvad det koster** | ⚠️ **Kan ikke laves endnu — se afsnit 9** |

**Holdning (3, 7 slides uden produktslide)**

| # | Titel | Kerne |
|---|---|---|
| 16 | **Et bryllup er et indkøbsprojekt** | "…med følelser oveni. Ingen siger det højt, fordi det lyder koldt" |
| 17 | **Lørdag i august er ikke en dato** | "Det er en kø. Enten stiller I jer op tidligt, eller også går I en anden vej" |
| 18 | **"Hej, hvad koster det?"** | "Den mail får aldrig svar. Det er ikke uhøfligt. Det er bare ubesvarligt" |

**Sæson (2, køres 26. dec – 15. feb)**

| # | Titel | Kerne |
|---|---|---|
| 19 | **Nyforlovet — start her** | Fem ting i januar. "De fleste bruger januar på Pinterest og februar på panik" |
| 20 | **Med i tasken til bryllupsmessen** | Syv ting. "Messetilbud, der ikke står på skrift, findes ikke" |

**De fem første, i rækkefølge:** 6 (Rækkefølgen) → 1 (745 kroner) → 7 (Otte linjer) →
13 (Hvad Ava gør) → 10 (Derfor svarer de ikke).

### 3.4 Budgetnedbrud — det ugentlige format

Ét format, kørt hver uge, i årevis. **20 minutter efter første opsætning.**
Fast titel: `[BELØB] kr. · [ANTAL] gæster · [SÆSON]`

Udfyld ni felter i et notat, før Canva åbnes:

```
1. Samlet beløb ......................... ______ kr.
2. Antal gæster ......................... ______
3. Sæson og ugedag ...................... ______
4. Lokale + mad + drikke ................ ______ kr. → ___ % → ___ kr./gæst
5. Post 2 (typisk foto) ................. ______ kr. → ___ %
6. Post 3 (typisk tøj) .................. ______ kr. → ___ %
7. Post 4, 5, 6 ......................... ______ / ______ / ______ kr.
8. Den beslutning der sparede mest ...... ____________ → ______ kr.
9. Buffer / rest ........................ ______ kr.
```

**Hvor budgetterne kommer fra, når vi ikke har kunder endnu:** modelbudgetter bygget på de
danske tal, altid mærket *"Modelbudget bygget på danske gennemsnitstal, 2026."* Derefter
indsendte budgetter — bed om dem anonymt i captionen. Efter ti uger er der en pipeline.

**Variationsakserne, så de aldrig ligner hinanden:** gæsteantal (40/70/100/140) × sæson
(fredag i maj / lørdag i august / lørdag i oktober) × type (rådhus + restaurant / gods /
hjemme i haven / udland). **48 kombinationer. Et år er 52 uger.**

### 3.5 Værktøj: Canva, ikke Figma

Figma er bedre til at *bygge* et system og værre til at *bruge* det. Ingen brugbar
flerside-eksport til Instagram, ingen mobiltilstand der duer i praksis, ingen lyd, ingen
planlægning. Hver uge ville koste tyve minutter ekstra i eksport og filhåndtering — over
et år er det to arbejdsdage brugt på at flytte PNG'er.

Canva: **Brand Kit** låser vores elleve farver og to skrifter, så man ikke kan komme til
at vælge en forkert grøn. Ét dokument = otte sider = otte PNG'er i én eksport.
**Skift lærredsstørrelse med ét klik** — hele genbrugsplanen hviler på den funktion.
Fraunces findes i Canva. Gratisniveauet rækker.

**Risikoen:** Canva inviterer til at ødelægge systemet — skygger, gradienter, stockfotos
ligger ét klik væk. Modgiften: **vi starter aldrig på et blankt lærred. Vi duplikerer en
skabelon.**

**Seks skabeloner, bygges én gang på ca. fire timer:**
karrusel (8 sider med marginer og hjælpelinjer) · talslide · tabel/gem-slide ·
søjle- og andelsdiagram · skærmbillede-kort · statisk enkeltopslag.

**Arbejdsreglen:** dupliker, skriv tekst, slet det ubrugte. Mangler der noget, tilføjes det
**til skabelonen først** — så det findes næste gang også.

### 3.6 Genbrug — én karrusel bliver til fire ting på 25 minutter

Kør det samme dag, mens filerne er åbne. Der laves aldrig ny grafik.

| Trin | Hvad | Tid |
|---|---|---|
| 0 | Eksportér 8 separate PNG'er, navngivet `[navn]_01` … `_08` | 2 min |
| 1 | **Reel:** skift lærred til 1080×1920, 1,8 sek. på slide 1-2, 2,5 sek. på 3-8, hårdt klip, samme lydspor | 7 min |
| 2 | **Stories:** slide 1, 3, 5, 8. Afstemning på den første, linksticker på den sidste. Gem som highlight | 5 min |
| 3 | **Nyhedsbrev:** overskrift = slide 1, brødtekst = slide 2, slide 8-billedet som eneste grafik, CTA = slide 7. **Ingen ny tekst skrives** | 6 min |
| 4 | **Pinterest:** lærred til 1000×1500, pin slide 1 og slide 8. Slide 8 performer — Pinterest belønner referencemateriale, præcis som saves | 5 min |

---

## 4. Copy

### 4.1 Caption-anatomi

Fem dele, altid i denne rækkefølge.

**1. Første linje (maks. 12 ord, står alene).** Skal indeholde mindst ét søgeord *ordret*
— `bryllup`, `bryllupsvenue`, `bryllupsbudget`, `bryllupsplanlægning`, `gæsteliste` eller
et regionsnavn. Instagram indekserer teksten, og linjen er det eneste, folk ser før "mere".
Skal indeholde **et tal, en tilstand eller en uafsluttet handling. Ikke et løfte.**
Ordet "AI" må aldrig være første ord.

> ✅ "Bryllupsvenue i Nordsjælland, 90 gæster, 150.000 kr. Elleve steder fik en mail i går aftes."
> ❌ "Har I svært ved at finde det rigtige sted?"

**2. Brud (én linje, maks. 8 ord).** Betaler for klikket med det samme.
*"Syv har svaret." · "Fire har ikke." · "Det tog fire minutter."*

**3. Brødtekst (2-6 korte sætninger).** Hvad der skete, i rækkefølge. Handlinger, ikke
muligheder. **Nævnes udgående mails, nævnes godkendelsen i samme afsnit.** Første gang Ava
optræder i en caption skrives *"Ava, vores AI-agent"*. Reelens frame 1 tæller ikke som
introduktion — captionen skal selv bære den.

**4. CTA (én linje).** Vi beder aldrig om to ting. Talopslag får **gem**. Demo-opslag får
**send**. Holdningsopslag får en åben linje, der kan besvares i kommentarfeltet.

**5. Hashtags (præcis 5, på egen linje).**

**Længde:** demo 25-60 ord · tal og karrusel 40-90 · fortællende 120-220, aldrig over.
*Begynder anden sætning at forklare første sætning, er captionen for lang.*

**Vi skriver hvad Kalas ikke gør, mindst hvert femte opslag.**

### 4.2 Hooks — et udvalg af de 40

**Venue-jagt**
- Bryllupsvenues skriver sjældent priser på hjemmesiden. Derfor tager det 14 dage at finde ud af, hvad noget koster.
- Bryllupsvenue-jagt, dag 9: 41 faner åbne, nul priser, ét regneark.
- Jeg åbnede 31 faner med bryllupsvenues i Nordsjælland. Så lukkede jeg dem alle sammen og skrev én sætning i stedet.

**Ubesvarede mails**
- Fire venues. Nul svar. Det er ikke personligt — de får 50 mails som din om ugen.
- Bryllupsvenuet svarede efter 11 dage. Datoen var væk efter 4.
- Du tjekker mailen for femte gang i dag. Hold op med det. Lad noget andet gøre det hvert femte minut.

**Budget**
- 745 kroner per gæst. Læs din gæsteliste igen.
- Budgettet skred ikke. Det var forkert fra dag ét, fordi ingen havde regnet på gæsteprisen.
- Bryllupsbudget uden priser er et ønske. Priserne står i mailsvarene.

**Gæsteliste og familiepres**
- Der er 12 mennesker på jeres gæsteliste, som ingen af jer har talt med i tre år.
- "Men han er jo din fars fætter." Han er også 900 kroner.
- Gæstelisten er ikke en liste. Det er en forhandling med fire parter.

**Tid og sæson**
- Bryllupsplanlægning foregår mellem kl. 21 og 23. På en telefon. I sengen.
- Bryllupsplanlægning er ikke svært. Det er 300 små beslutninger i forkert rækkefølge.
- Over 70 % af danske bryllupper holdes på en lørdag. Der er 52 af dem om året.
- Bryllupssæson: I konkurrerer ikke om venues. I konkurrerer om lørdage.

**Leverandørperspektivet**
- Bryllupsleverandører er ikke ligeglade. De er bagud.
- Fotografen svarer hurtigst på den mail, der allerede indeholder dato, sted og antal.

**Undersøgelsen**
- Bryllupsplanlægning tager lang tid. Hvor lang tid ved ingen i Danmark. Tallet findes ikke.
- Vi laver Danmarks første undersøgelse af, hvor mange timer et bryllup tager at planlægge.

### 4.3 Fem hashtag-sæt — præcis fem tags, aldrig blandet

| Sæt | Tags | Bruges til |
|---|---|---|
| **A · Standard** | `#bryllup #bryllupsplanlægning #forlovet #bryllupsvenue #bryllupidanmark` | Holdning, generelle demoer, alt i tvivl |
| **B · Venue** | `#bryllupsvenue #bryllup #bryllupslokale #bryllupsplanlægning #bryllupidanmark` | Alt hvor venue eller mailflowet er emnet |
| **C · Tal og budget** | `#bryllupsbudget #bryllup #bryllupsplanlægning #bryllupstips #forlovet` | Alt med et kronebeløb i første linje |
| **D · Sæson og region** | `#bryllupssæson #bryllupidanmark #bryllup #bryllupsvenue #[region]` | Femte plads udskiftes: `#nordsjælland`, `#fyn`, `#aarhus`, `#københavn` |

> ⚠️ **`#bryllup2027` er fjernet fra begge sæt.** Verifikationsrunden fandt **ingen spor
> af tagget overhovedet** — hverken i hashtag-databaser eller indeksering. Med et loft på
> fem tags er et årstalstag uden publikum 20 % af tagbudgettet brugt på ingenting.
> Genovervej det i løbet af 2027, hvis tagget begynder at få volumen.
>
> Bemærk også: **`#bryllup` er ikke kun dansk** — ordet er også norsk, så tagget deles
> med et norsk publikum. Det er en lille gratis nordisk bonus, ikke et problem.
| **E · Leverandør og udland** | `#bryllupsleverandør #bryllup #bryllupsvenue #bryllupsplanlægning #bryllupidanmark` | Ved destination byttes første tag til `#destinationsbryllup` |

### 4.4 Stories

Seks serier på 4-6 frames. Den vigtigste er **DM-driveren**, fordi sends og DM-aktivitet
er det stærkeste signal for at nå ikke-følgere:

> **Frame 1** — "Bryllupsvenue, 2027. De fleste starter med at google i tre timer."
> **Frame 2** *(afstemning: Er I begyndt at skrive til venues? Ja / Nej, ikke endnu)* —
> "41 faner. Nul priser. Ét regneark ingen af jer har åbnet siden marts."
> **Frame 3** — "Ava, vores AI-agent, googler rigtige venues, laver kort på dem og skriver
> tilbudsmailen. I godkender teksten, før noget bliver sendt."
> **Frame 4** — "Vi har lavet en kort startguide. Tre tal I skal have klar, og den
> rækkefølge der virker."
> **Frame 5** *(spørgsmål-sticker)* — "Skriv **AVA** i beskeden, så sender vi guiden.
> Ingen mailadresse, ingen tilmelding."

De øvrige fem: *Elleve mails* (demo) · *Fire lørdage* (sæson, med quiz) · *Regnearket*
(genkendelse) · *Vi mangler et tal* (undersøgelsen) · *Til leverandører* (6 frames).

### 4.5 Facebook-grupper — sådan svarer man

**Reglen: svaret skal kunne stå alene og være brugbart, hvis sidste afsnit blev slettet.**
Kalas nævnes kun, hvis vi har besvaret spørgsmålet først, og altid til sidst, med en linje
om at rådet gælder uanset.

> *"Nogen der har erfaring med venues i Nordsjælland til ca. 90 gæster? Vi er helt lost."*
>
> ✅ 90 gæster i Nordsjælland er et godt tal, fordi det udelukker de allermindste steder og
> åbner både gårde, herregårde og forsamlingshuse med tilkøbt catering.
>
> Tre ting der sparer jer tid:
> Spørg om totalpris inklusive personale, ikke lokaleleje. Det er der forskellene ligger.
> Spørg om overnatning på stedet eller inden for 10 minutter — med 90 gæster i Nordsjælland
> er transport hjem ofte den skjulte udgift.
> Skriv til alle jeres steder samtidigt. Venter I på svar fra nummer ét, før I skriver til
> nummer to, går der tre uger, og så er nummer to også væk til august.
>
> Skriv gerne jeres budget, så kan jeg blive mere konkret.

> ❌ Hej! Det lyder som en opgave for Kalas 😊 Vi er en ny dansk AI-bryllupsplanlægger, der
> finder venues for jer… Prøv det gratis på kalas-weddings.com — så slipper I for besværet!

Der er ingen hjælp i det andet svar. Personen står med et konkret spørgsmål og får en
reklame. **Én ban = kanalen er væk permanent.**

### 4.6 Kommentarbank — udvalg

**"AI kan ikke planlægge mit bryllup."**
> Nej. Ava planlægger heller ikke. Hun googler venues, laver kort på dem, skriver
> tilbudsmailen og læser svarene. I vælger sted, dato, gæster og budget. Mailen går ikke
> ud, før I har læst den og godkendt den.

**"Spammer I leverandørerne?"**
> Nej. Hvert venue får én mail, kun hvis parret har valgt netop det sted, og kun efter at
> parret har læst og godkendt teksten. Mailen indeholder dato, gæsteantal og budget, og
> svar-til går direkte til parret. Det er færre og mere præcise mails, ikke flere.

**"Det er da bare ChatGPT."**
> Sproget er en del af det. Resten er ikke. Ava googler rigtige venues og laver
> strukturerede kort, sender fra en mailboks efter jeres godkendelse, tjekker den mailboks
> hvert femte minut, læser svarene og trækker pris og ledighed ud på dashboardet. En
> chatbot kan skrive udkastet. Den kan ikke sende det, følge det eller vise dig, hvem der
> ikke har svaret.

**"Hvorfor hedder I noget svensk?"**
> Fordi kalas betyder fest. Vi er danske, produktet er på dansk, og tallene vi bruger er
> danske. Navnet er lånt.

**"Hvad med strømforbruget?"**
> Rimeligt spørgsmål. Ava laver tekst, ikke billeder og ikke video, og et venue-forløb er
> nogle få hundrede korte forespørgsler i alt. Vi kender ikke det præcise tal pr. mail, og
> vi vil ikke finde på et. Får vi et, vi kan stå inde for, skriver vi det.

### 4.7 Ti første linjer vi aldrig skriver

| ❌ | ✅ |
|---|---|
| "Drømmer I om det perfekte bryllup?" | "Bryllupsvenue til 90 gæster i Nordsjælland. Elleve steder fik en mail i går aftes." |
| "Bryllupsplanlægning behøver ikke være stressende." | "Bryllupsplanlægning foregår mellem kl. 21 og 23. På en telefon. I sengen." |
| "Med Kalas kan I nemt finde det perfekte venue." | "23 kort, 11 swipet til højre, én mail I godkendte." |
| "AI gør bryllupsplanlægning lettere end nogensinde." | "Bryllupsvenue-mails sendt kl. 22.14. Første svar kl. 07.31." |
| "Sig farvel til endeløse regneark og goddag til overblik." | "Bryllupsregnearket har tre faner med venues. Ingen af dem indeholder priser." |
| "Spar op til 38 timer på jeres bryllupsplanlægning." | "Bryllupsplanlægning i Danmark er aldrig blevet målt. Vi er ved at gøre det." |
| "Man bruger i snit 528 timer på at planlægge et bryllup." | "En amerikansk undersøgelse siger 528 timer pr. bryllup. Det danske tal findes ikke endnu." |
| "Læn jer tilbage — Ava klarer resten." | "Ava skriver mailen. I læser den, retter i den og godkender den. Først derefter går den ud." |
| "Hej! Jeg er Ava, og jeg finder jeres drømmevenue ✨" | "Ava, vores AI-agent, googler rigtige venues og laver et kort på hvert enkelt. I swiper." |

---

## 5. Distribution indbygget i produktet

**Den vigtigste del af planen.** Vi har nul annoncekroner og udviklingskapacitet — så
distributionen skal bygges, ikke købes.

### 5.1 Tid-til-værdi styrer rækkefølgen

Bryllupsplanlægning har 12-18 måneders horisont. Et par, der opretter konto i januar 2027,
publicerer sin bryllupshjemmeside i efteråret 2027 og trykker på nygift-skærmen i sommeren
2028.

| Kanal | Tid fra oprettelse til at kanalen fyrer | k |
|---|---|---|
| Ava-mailens afsenderidentitet | **0-3 dage** | 0,02 |
| Resultatkortet | **0-7 dage** | 0,15 |
| Ventelistens henvisning | **0-14 dage** | 0,20 |
| Bryllupshjemmeside + invitation + RSVP | 3-12 måneder | 0,30-0,60 |
| Nygift-skærmen | 12-18 måneder | 0,20 |

**De tre øverste er de eneste, der kan påvirke høstvinduet december-februar.**
Bryllupshjemmesiden er størst i volumen, men den er et **2028-aktiv** — byg den nu, fordi
den er billig, men lad den ikke tage plads fra resultatkortet.

I høstvinduet giver hver 100 anskaffede par ca. 35 gratis oveni. Ikke viralt — men en
tredjedel af væksten kommer gratis, og det er den tredjedel, vi ellers skulle have købt.
Fuldt indsvinget i 2028 nærmer vi os **k ≈ 1**, hvor produktet i praksis reproducerer sin
egen brugerbase.

### 5.2 Resultatkortet — det vigtigste enkeltstående vækstaktiv

Vi har præcis ét øjeblik, hvor produktet gør noget, ingen har set før. Alt andet, vi laver,
konkurrerer med noget eksisterende. Dette gør ikke.

Ved ≥3 svar eller 48 timer efter afsendelse dukker et kort op i dashboardet:

```
────────────────────────────────────────
   S O F I E   &   M A D S
   12. juni 2027 · Nordsjælland

   12          6 min       8         14 t
   forespørgsler  brugt   svar   til første svar

   ────────────────────────────────
   Sendt af Ava. Godkendt af os.
   kalas-weddings.com
────────────────────────────────────────
```

Knap: **"Del kortet"** → `/r/[token]` med OG-billede, så det ser rigtigt ud i Stories,
iMessage og Messenger.

**Privatlivsregler, ikke til forhandling:**
- Kortet viser **aldrig** venue-navne, priser eller hvem der svarede — heller ikke hvis
  parret gerne vil. **Priser fra en leverandørmail er leverandørens fortrolige oplysning,
  ikke parrets ejendom.** Den dag et venue ser sin tilbudspris på en offentlig story, har
  vi mistet branchen.
- Kun: antal, tid, svarantal, svartid, region, dato. Fornavne kun hvis parret slår det til.
- Delelinket er `noindex` og udløber efter 90 dage.
- Parret vælger aktivt at dele. Ingen automatisk publicering. Ingen "del for at låse op".

**Over stregen:** besparelse i kroner ("I sparede 34.000 kr" — det ved vi ikke) ·
venue-logoer · automatisk deling · henvisningsbelønning for at dele (det gør delingen
uærlig og tallene til reklame).

*Sekundær værdi, som er lige så stor: kortet er det bedste råmateriale, indholdsproduktionen
nogensinde får. Ét ægte kort med rigtige tal slår tyve mockups.*

### 5.3 Ava-mailen — afsenderidentitet

Stedet hvor vækst og tillid kolliderer direkte.

```
Fra:      Ava for Sofie & Mads <ava@kalas-weddings.com>
Svar til: ava+e7f3a91@kalas-weddings.com
Emne:     Forespørgsel: 12. juni 2027, 84 gæster — Sofie & Mads

Kære Bregnholm Gods

[brødtekst — parrets forespørgsel. Ikke ét ord om Kalas.]

Kærlig hilsen
Ava — på vegne af Sofie & Mads

──────────────────────────────────────────────
Ava er en AI-assistent, der skriver på parrets vegne.
Sofie & Mads har godkendt denne mail, før den blev sendt,
og de læser dit svar selv.

Om Kalas · Frameld forespørgsler fra Kalas
```

- **Afsendernavnet indeholder parrets navne.** Ærligt om hvem mailen er fra, og den eneste
  branding der ikke er reklame — den er nødvendig information.
- **Emnelinjen indeholder dato, gæsteantal og navne, ikke vores.** Et venue skal kunne
  triagere på 1,5 sekund. Den største enkeltstående venlighed, vi kan vise branchen.
- **Brødteksten er 100 % parrets.** Vi låner kuverten, vi ejer ikke brevet.
- **AI-oplysningen står under stregen, ikke over.** Den er obligatorisk, ikke en pointe.
  *(EU AI Act art. 50 om transparens — få det verificeret juridisk, men byg som om det
  gælder fuldt ud.)*
- **"Sofie & Mads har godkendt denne mail" er vores vigtigste sætning, også over for
  leverandøren.** Den fjerner den ene frygt en venue-ejer har, når hun ser en AI-afsender:
  at hun spilder tid på en bot uden et rigtigt par bagved.

**Aldrig byg:** tracking-pixel · "Prøv Kalas gratis"-CTA til leverandøren i
forespørgselsmailen · logo-banner øverst *(øverst = branding, nederst = oplysning)* ·
at fortælle leverandøren hvor mange andre venues parret har skrevet til ·
automatiske opfølgninger uden parrets godkendelse · at Ava svarer videre i tråden på
noget, parret ikke har set.

**Teknisk, samme dev-opgave:** `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` ·
suppressionsliste tjekket **før** Gemini-kaldet, ikke efter · hard cap på én forespørgsel
pr. venue pr. event · loft pr. modtagerdomæne pr. uge · bounce-håndtering.

### 5.4 Venteliste med ægte knaphed

Knapheden skal være sand, ellers kan vores egen kildekode modbevise den. Den **er** sand:
vi sender fra én fælles postkasse med afsendelseslofter, domæneomdømmet er et fælles aktiv,
og hver ny bruger koster reelle Gemini-kald.

> **Vi åbner for 40 nye bryllupper om ugen.**
> Ava skriver til venues fra én fælles postkasse. Åbner vi for hurtigt, falder
> svarprocenten for alle — også for jer. Derfor lukker vi ind i takt med, at vi kan holde
> svarprocenten oppe.
>
> I er nummer **63**. Vi regner med at åbne for jer omkring **8. september**.

**Tre spor:** henvisning rykker 5 pladser, maks. 3 · **kommer I fra en bryllupshjemmeside
lavet med Kalas, springer I køen over** · QR fra messen giver adgang samme dag.

**Over stregen:** falsk nedtælling · opdigtede kønumre · en kø-plads der ikke bevæger sig ·
ordet "eksklusivt". **Vi er ikke eksklusive — vi er kapacitetsbegrænsede, og det er en
mere sympatisk historie.**

---

## 6. Aktiver der skal produceres

### 6.1 Prioriteret liste

**Niveau A — uge 34-37. Alt andet venter.**

| Aktiv | Mkt | Dev | Klar |
|---|---|---|---|
| Attributionsfundament (`growth_events`, cookies, UTM-register) | 3 t | 1 dag | 23/8 |
| "Lavet med Kalas" gjort klikbart på fire ruter | 1 t | 0,5 dag | 23/8 |
| `/til-gaester` — gæstelandingsside | 2 t | 0,5 dag | 30/8 |
| **OG-billedgenerator** (`next/og`) — erstatter en designer permanent | 1 t | 1,5 dag | 6/9 |
| Lead magnet 1: "Mailen, der får venues til at svare" | 4 t | — | 30/8 |
| Nyhedsbrev sat op (MailerLite) + velkomstflow | 4 t | — | 6/9 |
| `/venueforespoergsel` — dedikeret landingsside | 3 t | 0,5 dag | 6/9 |
| Resultatkortet | 2 t | 2 dage | 20/9 |

**Niveau B — uge 37-42.** Leverandørside + framelding · "Sådan skriver Ava til jer" ·
venue-arket · Facebook-admin-gaven · e-mailflows · `/links` · ventelisten.
*20,5 timer, 4 dev-dage.*

**Niveau C — uge 41-46.** PR-blokken: rapporten, grafikpakken, pressemeddelelse, faktaark,
citatbank, `/undersogelsen` og `/presse`, tre pitch-runder. *27 timer, 2 dev-dage.*

**Niveau D — forberedes nu, bruges i december-februar.** `/messe` med QR ·
A6-messekort · ICS-tidslinjen · "Forlovet i julen"-siden · destinationsmailpakken på seks
sprog. *10,5 timer, 3 dev-dage.*

**Sum: 78 marketingtimer = præcis 13 uger × 6 timer.**

### 6.2 Det vi bevidst ikke producerer

- **Mediekit eller brandbog i PDF.** Ingen skal bruge den. Brug `docs/DESIGN_SYSTEM.md`.
- **Blog med SEO-artikler.** 12-18 måneders horisont på afkast. Undersøgelsen giver mere
  organisk trafik på én dag, end 20 artikler gør på et år.
- **Case studies.** Vi har ikke nok kunder. Marts 2027.
- **Trykt brochure.** Enhver trykt ting forældes. QR-koder gør ikke.
- **En offentlig, indekseret venue-database.** Fristende for SEO — men vi ville publicere
  leverandørdata hentet via Google-grounding, uden deres samtykke, med priser fra deres
  mails. **Det er præcis den ene ting, der kan få branchen til at gå sammen imod os. Aldrig.**

### 6.3 Lead magnets — syv, hvoraf fire ikke er PDF'er

| # | Aktiv | Format | Hvorfor |
|---|---|---|---|
| **LM1** | **"Mailen, der får venues til at svare"** — den faktiske skabelon + de 6 fejl | 1 A4, HTML → PDF + Google Doc | Det eneste sted vi kan give hele kerneværdien væk gratis og stadig vinde. Vi sælger ikke skabelonen — vi sælger at slippe for at sende den 12 gange |
| **LM2** | **Venue-arket** — 40 spørgsmål + automatisk tilbudssammenligning | **Google Sheet**, ikke PDF | Regneark bliver kopieret og sendt videre. PDF'er bliver downloadet og glemt. Den deler sig selv i et parforhold |
| **LM3** | **Bryllupsbudget i danske tal** | Google Sheet | Opdateres i november med **vores egne undersøgelsestal** — samme fil, ny autoritet, nul ekstra arbejde |
| **LM4** | **Admin-gaven:** "De 25 spørgsmål jeres gruppe får hver uge — med svar" | Google Doc, **Kalas nævnes ikke i teksten** | Admins bruger deres fritid på de samme spørgsmål. Vi sælger dem ikke noget — vi tager en opgave fra dem. Den eneste tilnærmelse en gruppeadmin ikke afviser |
| **LM5** | **`/messe`** — QR på et A6-kort → personlig venue-liste på mail inden for 10 min | Kodet side | Alle andre uddeler brochurer. Vi leverer et resultat, mens de står der. Det er også den mest ærlige produktdemo, vi kan give |
| **LM6** | **"14 måneder til bryllup"** — 40 opgaver bagudregnet fra datoen | **.ics-fil**, ikke PDF | En PDF om tidsplanlægning åbnes aldrig igen. En kalenderfil dukker op i deres liv 40 gange over 14 måneder. **Vi skal ikke kæmpe om deres opmærksomhed — vi skal bo i deres kalender** |
| **LM7** | **"Sådan skriver I til et udenlandsk venue"** — færdige mails på 6 sprog | Google Doc + web | Nul dansk konkurrence på emnet, og kan ikke kopieres af bryllup.dk |

**DM til gruppeadmin, ordret:**

> Hej [navn] — jeg hedder [navn] og har fulgt gruppen et stykke tid. Jeg har lagt mærke
> til, at de samme 25 spørgsmål kommer igen hver uge. Jeg har skrevet svarene sammen i et
> dokument, I frit må fastgøre og redigere i, hvis I kan bruge det. Der er ikke noget link
> i det og ingen betingelser. Sig endelig til, hvis I hellere vil være fri — så hører du
> ikke fra mig igen.

### 6.4 E-mailflows

Ren tekst-følelse, serif-overskrift, én farve, **aldrig et billede af et menneske.**

| Flow | Udløses | Emnelinje |
|---|---|---|
| Velkomst 1 | Ved oprettelse | `Ava er i gang` |
| Velkomst 2 | Dag 2 | `Hvorfor 8 ud af 10 venues ikke svarer` |
| Velkomst 3 | Dag 5, kun hvis intet er sendt | `Skal Ava lede for jer?` |
| Venteliste | Straks | `I er nummer 63` |
| Efter venue-søgning | ≥8 kort, 0 sendt efter 24 t | `12 steder venter på jeres ja` |
| Efter afsendelse | Straks | `Forespørgslerne er ude` |
| Første svar | Straks | `Bregnholm svarede — 12. juni er ledig` |
| Ved 3+ svar | Straks | `Tre svar inde. Her er de side om side.` |
| Ingen svar | Dag 5 | `Fire har ikke svaret. Skal Ava rykke?` |
| Inaktiv | Dag 14 | `Skal vi lægge det på pause?` |
| Inaktiv | Dag 45 | `Vi rydder op` |
| Efter brylluppet | Dag 7 | `Hvordan gik det?` |
| **Til leverandøren** | Når worker'en registrerer et svar | `Tak — Sofie & Mads har fået jeres svar` |

**Rykker-mailen er vigtig, fordi den viser, at kontrollen er parrets:**
> Fire af de tolv har ikke svaret. Det er normalt — især i højsæsonen.
> Ava kan sende én venlig rykker. **Hun gør det ikke, før I trykker. Og hun sender kun én.**

**Oprydningsmailen koster os få konti og køber os, at ingen nogensinde kalder os spam:**
> Vi rydder op i konti, der ikke bliver brugt. Jeres data bliver liggende i 90 dage til,
> hvis I vender tilbage — derefter sletter vi det. Skal vi lade være?

**Leverandørmailen er den mest oversete i hele planen.** Uden den er vi en ukendt afsender,
der pludselig sender AI-genereret mail til danske venues. Med den er vi en navngiven
virksomhed, der forklarer sig, tilbyder en udvej og giver noget væk:

> Jeres svar på forespørgslen til 12. juni 2027 er nået frem til Sofie & Mads. De læser det selv.
>
> Kort om, hvad der lige skete: Sofie & Mads planlægger deres bryllup med Kalas. **Ava er en
> AI-assistent, der skriver forespørgsler på parrets vegne — parret godkender hver eneste
> mail, før den bliver sendt, og de læser jeres svar selv.** Vi videresælger ikke jeres
> oplysninger, vi offentliggør ikke jeres priser, og vi tager ikke kommission.
>
> **Få jeres oplysninger rigtige.** Kapacitet, sæsonpriser, hvad der er inkluderet, hvilke
> datoer der er optaget. Fem minutter, gratis — og det betyder, at par ikke skriver til jer
> om datoer, I alligevel ikke har.
>
> **Eller slip for at høre fra os.** Ét klik, virker med det samme, ingen login.
>
> Har I spørgsmål, kan I bare svare på denne mail. Der sidder et menneske.

*Den mail er billigere end enhver krisehåndtering.*

### 6.5 Leverandørsporet — en produktrisiko, ikke en marketingopgave

**Vi sender mail på tredjeparts vegne fra én fælles postkasse.** Det betyder:

- **Domæneomdømmet er ét fælles aktiv.** En spamklagerate over ~0,3 % forringer leveringen
  for **alle** parrenes forespørgsler samtidig. Ét par, der skriver til 40 venues på en dag,
  kan koste alle andre par deres svar.
- **Fejlen er ikke lokal.** En dårlig kampagne koster en kampagne. Dårlig udgående
  mailpraksis koster produktets kernefunktion permanent.
- **Modparten er organiseret.** Danske venue-ejere sidder i de samme Facebook-grupper som
  brudeparrene. Én tråd med titlen *"Har I også fået disse AI-mails?"* med 60 kommentarer
  er svær at komme tilbage fra — og vi ville ikke engang være med i den.

**Det hører under drift, ikke marketing. Grænserne skal være hårde grænser i koden.**

**De seks regler, offentligt på `/for-leverandorer`:**
> 1. Ava skriver aldrig til jer, uden at et rigtigt par har godkendt netop den mail.
> 2. Én forespørgsel pr. bryllup. Aldrig den samme forespørgsel to gange.
> 3. Højst én rykker, og kun hvis parret selv beder om det.
> 4. Framelding virker med det samme og for altid. Ét klik, intet login.
> 5. Vi videresælger ikke jeres oplysninger, og vi offentliggør ikke jeres priser.
>    Heller ikke anonymiseret, heller ikke i undersøgelser.
> 6. Det står i hver eneste mail, at Ava er en AI-assistent.

At publicere reglerne er selv beskyttelsen: den dag nogen spørger kritisk, findes svaret
allerede offentligt og dateret.

**Fire ting forebygger, at branchen vender sig mod os, i rækkefølge efter effekt:**
1. **Forespørgslerne skal være bedre end det, de får i forvejen.** Oplever leverandørerne,
   at Kalas-mails er de nemmeste at svare på, er slaget vundet. Det er en produktopgave.
2. **Frameldingen skal virke perfekt, øjeblikkeligt, hver gang.** Én leverandør, der
   framelder og alligevel får en mail, er nok til en tråd.
3. **Giv dem noget, før vi beder om noget.** Konkret: **undersøgelsens leverandørtal sendes
   gratis til alle leverandører i kontaktlisten 6. november — fire dage før pressen får den.**
4. **Vi skal have et ansigt.** Et anonymt AI-brand, der masseudsender, har ingen
   forsvarslinje. En person, som 30 leverandører har givet hånd på en messe i januar, har det.

---

## 7. PR: undersøgelsen

**Præmissen er stærkere, end vi bruger den til.** En journalist kan ikke skrive "ifølge en
ny undersøgelse" om noget, der ikke findes — så den dag den findes, er den automatisk en
historie.

### 7.1 Hvad der gør historien uafviselig

1. **Den er den første.** Nyhedskriteriet er opfyldt per definition.
2. **Rådata ligger offentligt** som anonymiseret CSV. Det fjerner journalistens største
   indvending mod virksomhedsundersøgelser: at de er reklame forklædt som statistik.
3. **Vi peger selv på svaghederne.** Metodeafsnittet står **forrest**, ikke bagerst, og
   siger hvem vi ikke har fanget. En journalist, der ikke behøver være skeptisk, skriver
   hurtigere.
4. **Der er en konflikt indbygget:** parrenes oplevelse af svartider **over for**
   leverandørernes egne tal om, hvorfor de ikke når at svare. To parter, to sandheder —
   det er en historie, ikke en statistik.
5. **Der er mennesker klar.** Tre par, der vil interviewes og fotograferes.
6. **Grafikken er færdig og fri** under CC BY 4.0. En redaktion, der ikke skal booke en
   grafiker, siger oftere ja.

**Vi hverken bruger eller citerer amerikanske tal i pressematerialet.** Ét ubekræftet
udenlandsk tal i en pressemeddelelse smitter af på alle vores egne.

### 7.2 Tidsplan

| Hvornår | Hvad |
|---|---|
| Uge 34-40 | Feltarbejde. **Mål: min. 400 par + 120 leverandører** |
| **4. oktober** | Datalukning. **Under 300 parbesvarelser → vi udskyder til januar. Vi udgiver ikke tynde tal** |
| Uge 41-43 | Analyse, rapport, grafik, pressemateriale |
| **27. oktober** | Eksklusiv-pitch til **ét** medie, 48 timers svarfrist |
| 5. november | Embargo-udsendelse til bølge 2, embargo til 10/11 kl. 06 |
| 6. november | **Leverandørrapporten til leverandørlisten — fire dage før pressen** |
| **10. november, tirsdag kl. 06** | Publicering. Nyhedsbrev kl. 07 |
| 10.-12. november | Vi er tilgængelige. Telefonen tages. Det er hele ugens opgave |
| Uge 47 | Bølge 3: fagpresse. **Herunder bryllup.dk's magasin** — ja, konkurrenten. De er også et medie, og førstegangsdata om deres egen branche er svær at ignorere. Værste udfald: nej |
| Uge 48-49 | Bølge 4: podcasts og radio + **scenepitch til messearrangøren** |

*Tirsdag kl. 06: mandag drukner i weekendens efterslæb, torsdag/fredag har kortere levetid.
Tirsdag morgen har den længste hylde og bedst chance for at blive taget op onsdag.*

**Vigtigt for den, der udfører:** find det aktuelle byline ved at slå de seneste 30 dages
artikler op — journalister skifter redaktion. Redaktionspostkassen er indgangen, den
navngivne journalist er målet. **Opfind aldrig et navn.**

### 7.3 Den ene sætning, der flytter en pitch fra reklame til kilde

> Til fuld åbenhed: Kalas er en dansk bryllupsplanlægger, som jeg har været med til at
> bygge. Undersøgelsen er lavet, fordi tallene ikke fandtes — ikke fordi de var gode for os.
> **Ét af fundene ([kort beskrivelse]) er ubelejligt for os, og det står i rapporten på lige
> fod med resten.** Rådata ligger offentligt, så I kan tjekke det.

---

## 8. Bryllupsmesserne i januar

Aalborg 10/1 · **København 16.-17/1** · Aarhus 31/1 · Vejle 7/2 · Odense 14/2.
Alle arrangeret af bryllup.dk — som også er vores konkurrent. Det er et vilkår.

**Anbefaling: ingen stand i 2027. Vi går som gæster, og vi går efter leverandørerne.**

Begrundelsen er ikke primært prisen (8.000-15.000 kr for København). Det er, at **en stand
løser det forkerte problem.** En stand løser "ingen kender os blandt brudepar" — men med 6
marketingtimer om ugen kan vi ikke betjene en pludselig bunke leads. Vores faktiske
flaskehals i januar 2027 er **leverandørsiden**: at Ava skriver til venues, der aldrig har
hørt om os, og som derfor svarer langsomt. Svarprocenten er hele produktets værdi.

**Og på en bryllupsmesse står 80-150 danske venues bag borde og keder sig mellem besøgende.**
Det er den billigste leverandørkontakt, der findes i Danmark.

| Ting | Pris |
|---|---|
| `/messe`-siden (QR → personlig venue-liste på mail inden for 10 min) | 0 kr, 1,5 dev-dag |
| A6-kort, 250 stk., ivory, serif, én sætning, én QR | 350-600 kr |
| "Sådan skriver Ava til jer", 60 tryk | ~200 kr |
| Billetter | 0-200 kr |

**Samlet: 550-1.000 kr.** Kan finansieres uden et budget.

**Mål for København, skrevet ned på forhånd:** 40 leverandørsamtaler · 25 kontaktoplysninger
· 15 leverandører der siger ja til materialet · 60 QR-scanninger · 30 mails.

Åbningsreplikken til leverandørerne, som person:
> *"Hej — jeg bygger et værktøj, hvor par sender forespørgsler til venues. Jeg vil gerne
> høre, hvad der gør en forespørgsel let for jer at svare på, og hvad der gør den umulig."*

Det er et ægte spørgsmål, det er research til undersøgelsen, og det er den mest effektive
introduktion, vi kan lave.

**Ingen uddeling på gulvet** — det er imod messens regler for ikke-udstillere og dårlig stil.
Kortene lægges hos de leverandører, vi har talt godt med, og gives 1:1 i køen og i caféen.

### Det tredje spor — det bedste, og det gratis

**Pitch messearrangøren et scenepunkt, med undersøgelsen som adgangsbillet.** Messer har
scener, og arrangøren skal fylde dem. Fra 10. november har vi det eneste danske datasæt om,
hvordan par bruger deres planlægningstid. *"Sådan bruger danske par deres tid, når de
planlægger bryllup"* er præcis den slags indhold, en arrangør mangler — og det er ikke et
salgsoplæg.

**20 minutter på en scene foran 200 brudepar er mere værd end to dage bag et bord, og det
koster nul kroner.**

**Målepunktet der afgør 2028:** giver `/messe` over 150 mails og over 20 leverandører på
tværs af de fem messer, sætter vi 12.000 kr af til en stand i København 2028. Hvis ikke,
gør vi det samme igen gratis.

---

## 9. Måling

### Værktøjer — samlet udgift 0 kr/md

| Formål | Værktøj | Gratisniveau |
|---|---|---|
| Web-analytics | **Umami Cloud** | 3 sites, 100k events/md. Cookiefri — intet samtykkebanner |
| Produkt-analytics | **Egen `growth_events`-tabel i Supabase** | Vi har allerede Postgres. Præcis attribution, gratis for altid, ingen tredjepart der kan skifte pris |
| Nyhedsbrev | **MailerLite** | 1.000 abonnenter, 12.000 mails/md, **automations inkluderet** — det eneste gratisniveau der har dem |
| Opslagsplanlægning | Meta Business Suite + TikTok native | Gratis |
| Undersøgelse | Google Forms | `docs/google-forms-script.gs` ligger allerede i repoet |
| Grafik | **Egen OG-generator** + Canva til rest | Alt gentagende kodes |
| Link-i-bio | **Egen `/links`-side** | Vi ejer klikdataen og matcher brandet |

### UTM-konvention

```
utm_source   = instagram | tiktok | facebook_group | nyhedsbrev
             | wedding_site | invitation | resultatkort | vendor_mail | messe | presse
utm_medium   = social_organic | email | referral_product | print_qr | earned
utm_campaign = ÅÅÅÅ-MM-slug         fx  2026-09-venuebrev
utm_content  = variant              fx  bio | story3 | footer | kort-a6
```

**Alle store bogstaver forbudt** — analytics behandler `Instagram` og `instagram` som to
kilder, og det er den fejl, der ødelægger flest attributionsopsætninger.

**Ét ark med en formel, der bygger URL'en ud fra fire dropdowns. Ingen skriver et UTM-link
i hånden.**

### Attributionskæden

1. Middleware læser UTM-parametre på ethvert landingspunkt.
2. To cookies: `kalas_attr_first` (90 dage, overskrives aldrig) og `kalas_attr_last`
   (30 dage, overskrives altid).
3. Ved kontooprettelse skrives **begge** til `profiles` + landingsside, henvisende domæne,
   tidsstempel.
4. `growth_events` logger fem tilstande:
   `visit → signup → onboarding_complete → venues_generated → outreach_sent`
5. Ét SQL-view, `weekly_growth`. Fredagsrutinen er at køre ét query.

**Både første- og sidste-berøring gemmes.** Vores kanaler har lange forsinkelser — et par
ser et opslag i september og opretter konto i januar. Med kun sidste-berøring vil alt ligne
"direkte trafik", og vi vil konkludere, at Instagram ikke virker. **Det ville være den
dyreste fejlkonklusion, vi kan træffe.**

### Fem tal, hver fredag kl. 15, femten minutter

1. **Nye konti** — og hvor mange med kendt kilde
2. **Par der nåede en afsendt forespørgsel** — nordstjernen. En konto uden afsendt
   forespørgsel er nul værd
3. **Nye mails på listen** — beholdningen til december-vinduet
4. **Svarprocent fra venues, 72 timer** — produktkvalitet = mund-til-mund
5. **Følgere på Instagram** — sidst med vilje. Mest synlige, mindst vigtige

**Plus én linje, der ikke er et tal:** *"Det bedste en bruger sagde i denne uge."* Ordret.
Den linje bliver til opslagstekster, landingssidetekster og pressecitater — og efter et
halvt år er den kolonne det mest værdifulde i arket.

**Reglen:** tager et tal mere end tre minutter at hente, skal det automatiseres inden næste
fredag eller fjernes fra arket. Et måleark, der tager en time, bliver ikke udfyldt i uge 6.

---

## 10. 90-dages produktionskalender

6 marketingtimer/uge. **Ingen uge har mere end én stor ting.**

| Uge | Tema | Marketing | Dev | Udgives |
|---|---|---|---|---|
| **34** · 17-23/8 | Fundament | UTM-register (2t) · Umami (1t) · **spørgeskema ud (3t)** | `growth_events` + cookies (1) · sidefod klikbar (0,5) | — |
| **35** · 24-30/8 | Første lead magnet | LM1 (4t) · ventelistetekster (2t) | `/til-gaester` (0,5) · venteliste (1) | LM1 · ventelisten |
| **36** · 31/8-6/9 | Nyhedsbrev | MailerLite + velkomst 1-2 (4t) · landingssidetekst (2t) | OG-generator (1,5) · `/venueforespoergsel` (0,5) | Landingssiden |
| **37** · 7-13/9 | Facebook-grupperne | Kortlæg 12 grupper (1t) · **admin-gaven (4t)** · rykker (1t) | `/links` (0,5) | Admin-DM til 4 grupper |
| **38** · 14-20/9 | Venue-arket | LM2 (4t) · admin-DM 5-8 (1t) · **første fredagstal** (1t) | Resultatkort del 1 (1,5) | Venue-arket |
| **39** · 21-27/9 | Leverandørsporet | `/for-leverandorer` (3t) · "Sådan skriver Ava" (2t) · reglerne (1t) | Resultatkort del 2 (0,5) · leverandørside + framelding (1,5) | Leverandørsiden · resultatkortet |
| **40** · 28/9-4/10 | Datalukning | Sidste push (2t) · **rekruttér 3 par til pressen (2t)** · LM3 (2t) | SPF/DKIM/DMARC + suppressionsliste (1) | Budgetarket |
| **41** · 5-11/10 | **Analyse. Intet andet** | Analyse af rådata (6t) | E-mailflows (1,5) | — |
| **42** · 12-18/10 | Rapport del 1 | Metode + 4 første fund (6t) | Leverandørmailen (0,5) | — |
| **43** · 19-25/10 | Rapport færdig | Del 2 (3t) · grafik (1t) · presse (2t) | Grafikpakken (1) · `/undersogelsen` + `/presse` (1) | — |
| **44** · 26/10-1/11 | Eksklusiv-pitch | **Pitch 27/10** (3t) · ICS-indhold (3t) | `/messe` del 1 (1) · ICS-generator (0,5) | **Messekort bestilles 1/11** |
| **45** · 2-8/11 | Embargo | Bølge 2 den 5/11 (3t) · **leverandørrapport 6/11** (1t) · nyhedsbrev klar (2t) | `/messe` del 2 (1) | — |
| **46** · 9-15/11 | **Udgivelse** | **10/11 kl. 06 live.** Nyhedsbrev kl. 07. Telefonen tages hele ugen | Beredskab (0,5) | Rapporten · alle kanaler |

**Belastning:** uge 34-40 jævn · **uge 41-43 tungest** (18 timer på rapporten — det er den
ene ting, der ikke kan skæres; skæres der, skæres LM3 og LM6) · uge 44-46 kalendertung men
ikke timetung.

**Rapportens grafik i uge 46 er samtidig seks færdige karruseller**, som indholdsproduktionen
ikke selv skal researche.

---

## 11. Åbne beslutninger

Ting der ikke kan produceres, før nogen tager en beslutning.

| Hvad | Blokerer | Hvem beslutter |
|---|---|---|
| **Prisen.** Produktet er gratis at gå i gang med, men der er ingen besluttet pris bagefter | Karrusel 15 "Hvad det koster" · velkomstflowets svar på prisspørgsmålet · kommentarbankens "hvad koster det?" | Ejer |
| **Om `hideBranding` skal koste noget.** I dag er den gratis og default `false` | Hvor hårdt vi må regne med bryllupshjemmesiden som kanal | Ejer |
| **EU AI Act art. 50** — transparenskravet ved AI-genereret kommunikation til tredjepart | Den præcise formulering i Ava-mailens sidefod | Juridisk gennemgang |
| **Kapacitetsloftet.** "40 nye bryllupper om ugen" skal være det reelle tal, ikke et pænt tal | Ventelistens tekst | Dev + ejer |

**Tre spørgsmål hvert opslag skal bestå, før det går live:**

1. **Viser det arbejde, der bliver udført** — eller beskriver det bare en feature?
2. **Er godkendelsen synlig**, hvis der er en mail involveret?
3. **Kan hvert tal forsvares** over for en skeptisk kommentar, med dansk kilde eller vores
   egen skærm?

Tre gange ja, ellers om igen.
