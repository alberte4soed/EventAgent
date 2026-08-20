# Kalas — hvad du gør nu

**Den korte version. 14. august 2026.**
Baggrunden ligger i [`some-strategi.md`](./some-strategi.md) og [`indholdsplan.md`](./indholdsplan.md).
Du behøver ikke læse dem for at følge denne side.

---

## Konklusionen

**Du skal ikke markedsføre Kalas endnu. Du skal sælge det til 20 par i hånden.**

Der er tre grunde, og de er alle sammen fundet ved at regne efter, ikke ved at mene noget:

1. **Marketingplanen er 3× for stor.** Driften alene — Reels, karruseller, Stories,
   kommentarer, grupper, nyhedsbrev — er ~11 timer om ugen, før der er bygget ét aktiv.
   Med aktiverne oveni er behovet 17-19 timer. Du har 6.
2. **Kernehypotesen er ikke bevist.** At danske venues svarer på en mail fra en afsender,
   de aldrig har hørt om, er hele produktets værdi. Det er aldrig målt ved volumen.
   Markedsfører du først, opdager du det med publikum på.
3. **Feltet er ikke tomt.** Der findes mindst syv gratis danske planlægningsværktøjer med
   gæsteliste, budget og leverandørkatalog. Du kan ikke vinde på "værktøjet". Du kan kun
   vinde på, at mailen bliver sendt og svaret kommer hjem.

---

## Fire beslutninger, i denne uge

**1. Prisen: 699 kr, én gang, betales når I trykker send.**
Alt før afsendelsen er gratis — chat, søgning, venue-kort, swipe, og at læse mailen.
Ankeret er, at én gæst koster 745-1.000 kr. Break-even er 20 betalende par om året.
Sæt den i luften nu. Færdig copy ligger klar.

**2. Bryllupshjemmesiden: gratis eller betalt?**
Der ligger allerede en Stripe-betalingsmur på den i koden (`/api/website/checkout`,
`website_orders`, `websitePriceCents()`). Væksthistorien forudsætter det modsatte: siden
er din eneste gratis distributionskanal — 90 gæster pr. bryllup, i præcis den aldersgruppe
der selv skal giftes, til 10-20 kr i hosting.
**Du kan ikke have begge dele. Vælg.** Anbefaling: gratis.

**3. Sendeloft på postkassen — før noget som helst andet.**
Der er ingen throttling nogen steder i `src/lib/gmail`, `src/lib/outreach` eller `worker/`.
Alle brugere sender fra samme `ava@kalas-weddings.com`. 100 aktive par × 12 venues =
1.200 kolde mails fra én adresse mod anslået 600-900 danske bryllupsvenues i alt.
Det samme venue får den samme robotmail flere gange om ugen, og når ti af dem trykker
"rapportér spam", holder produktet op med at virke **for alle brugere samtidig**.
Loft pr. venue pr. 30 dage på tværs af alle brugere. Døgnkvote. Separat sendedomæne.

**4. Bryllupsmessen i København er 6. september. Ikke i januar.**
Tre uger væk. Vi havde overset den. Billet 75 kr i forsalg. Gå som gæst, tal med
leverandørerne, ikke med parrene. Standpriser er ikke offentlige og kategorier meldes
udsolgt — ring 7642 8100, hvis du vil vide mere.

---

## De næste 13 uger

**Uge 1-2 — luk risikoen (12 t)**
Sæt prisen. Byg sendeloftet. Én landingsside med ét løfte og én knap.
Skriv tre tal ned med en stopklods hver: brugbare tilbud retur · svarprocent · kroner.

**Uge 1-6 — 20 rigtige par, håndholdt (25 t)**
Rekruttér dem manuelt: eget netværk, direkte DM til nyforlovede, den ene danske
Facebook-gruppe vi har kunnet bekræfte. Sid ved siden af dem hele vejen. Ret det, der
går galt.
**Alle 20 skal enten betale eller sige nej til at betale.** Begge dele er data.
**Stopklods: under 35 % svar på 200+ mails = alt marketing stopper, og du fikser
produktet i stedet.**

**Uge 3-13 — indhold: én kanal, ét format (20 t)**
Instagram alene. **2 opslag om ugen, ikke 4.** Ét format: skærmoptagelse af en *rigtig*
forespørgselsrunde med et *rigtigt* resultat. "12 venues. 6 minutter. 8 svar."
Ingen anden dansk konto kan lave det billede.

**Uge 4-13 — leverandørerne, proaktivt (12 t)**
Personlig mail fra dig — ikke fra Ava — til de 200 største danske bryllupsvenues:
*sådan ser en forespørgsel fra os ud, sådan framelder I.* Ring til 15 af dem, optag
citaterne. Det er både produktudvikling og PR-råstof.

**Buffer: 6 timer.** Bruger du dem ikke, er planen for lille — og det er den rigtige fejl
at lave lige nu.

---

## Hvad du dropper

| Drop | Hvorfor |
|---|---|
| **TikTok, Pinterest, LinkedIn, YouTube** | Én person, én kanal. Alt andet er selvbedrag |
| **Nyhedsbrevet** | Indtil der er 200 mails at sende til |
| **12 af 13 e-mailflows** | Behold velkomst + "dit resultat" |
| **6 af 7 lead magnets** | Behold venue-mailskabelonen. Den demonstrerer produktet |
| **Attributionsopsætningen i Supabase** | Du har ikke trafik at attribuere. Ét regneark rækker til 10.000 besøg |
| **OG-generatoren og resultatkortet** | Betjener brugere, der ikke findes endnu. Udskyd til 50 gennemførte runder |
| **Spørgeskemaundersøgelsen i sin nuværende form** | Se nedenfor |

**Det frigør ca. 45 af de 78 timer.**

---

## Undersøgelsen: lav den om

400 par på syv uger uden publikum og uden budget er ikke realistisk — regnestykket lander
på 80-200. Under 300 udløser planens egen klausul, og så er november tom.

**Brug jeres egne data i stedet.** `worker/poll.ts` måler allerede præcis det, historien
handler om:

> *"Vi sendte 340 forespørgsler til danske bryllupsvenues på vegne af rigtige par.
> 41 % svarede aldrig. Gennemsnitlig svartid på dem, der svarede: 4,2 dage.
> 1 ud af 6 svar indeholdt slet ingen pris."*

Førstegangsdata. Nul rekruttering. Kan ikke afvises som selvrapporteret. Bedre historie,
fordi den handler om branchen og ikke om forbrugerne — og dermed lettere at få i
fagpressen. **6 timer i stedet for 27.** Det kræver kun, at du sender rigtige forespørgsler
i efteråret, hvilket du alligevel skal.

---

## Tre ting vi ikke ved, og som du skal tjekke selv

1. **Alle konkurrenttal er andenhånds.** To researchrunder er begge blevet blokeret fra
   Instagram og Facebook. Tallene matcher på tværs af runderne, men det er den samme
   søgeindeksering læst to gange. **20 minutter i en browser lukker det.**
2. **Facebook-grupperne findes muligvis ikke som antaget.** Tre af fire kendte "grupper"
   viste sig at være sider med 837 og 10.539 likes. Kun én gruppe er bekræftet, og
   medlemstallet kan ikke ses uden login. **Hvis grupperne er kanalen, hviler planen på
   noget, ingen har kunnet finde.**
3. **Markedet er mindre end 32.624 par.** Ca. 5.400 var udenlandske par (3.000 alene på
   Ærø — bryllupsturisme, der ikke køber en dansk planlægger), og to tredjedele er
   borgerlige ceremonier. Brug ikke 32.624 som adresserbart marked i Innofounder-ansøgningen
   uden det forbehold. En bedømmer regner efter.

---

## Det, der er rigtigt i planen, og som du beholder

Positioneringen: *"Alle andre giver dig en liste. Kalas sender mailen."*
Sætningen: **"I godkender alt."**
At du aldrig leder med ordet AI i en overskrift.
Skærmoptagelse som primærformat.
Facebook-grupper som privatperson, aldrig som brand.
Ingen messestand.

Problemet var aldrig, at planen tænkte forkert. Problemet er, at den er dimensioneret til
fire mennesker og finansieret med én.
