import type { ChecklistArea } from './shared';

/* The default Danish checklist — the granular layer under the timeline.

   Rule: no title here may restate one of the 14 milestone titles in data.ts.
   The timeline says "Book venue"; the checklist says "Aftal hvornår I må
   rykke ind dagen før". Keeping the layers disjoint is both a UX rule and
   what keeps strings.ts free of duplicate keys (a TS1117 build error).

   Content covers the Danish specifics a generic list misses: prøvelsesattest
   and ægteskabserklæring, salmer and kirkepynt, sanghæfte and indsamlede
   sange, toastmaster, brudevals før midnat, æresport, ris/sæbebobler.

   Every title needs an English entry in strings.ts, TaskRow renders stored
   titles through t(), so an untranslated seed shows up as Danish text in an
   otherwise English list. */

export type ChecklistSeed = { area: ChecklistArea; title: string };

export const DEFAULT_CHECKLIST: ChecklistSeed[] = [
  // ── Økonomi & budget ──
  { area: 'okonomi', title: 'Bliv enige om det samlede beløb I vil bruge' },
  { area: 'okonomi', title: 'Tal med familien om hvem der bidrager med hvad' },
  { area: 'okonomi', title: 'Læg ti procent til side som buffer til uforudsete udgifter' },
  { area: 'okonomi', title: 'Opret en fælles konto til bryllupsudgifter' },
  { area: 'okonomi', title: 'Saml alle tilbud I har fået hjem ét sted' },
  { area: 'okonomi', title: 'Skriv ned hvornår hvert depositum skal betales' },
  { area: 'okonomi', title: 'Sæt en påmindelse på hver betalingsfrist' },
  { area: 'okonomi', title: 'Tjek om jeres indboforsikring dækker ringe og gaver' },
  { area: 'okonomi', title: 'Undersøg afbestillingsforsikring til brylluppet' },
  { area: 'okonomi', title: 'Læs det med småt om afbestilling hos hver leverandør' },
  { area: 'okonomi', title: 'Regn ud hvor mange gæster budgettet kan bære' },
  { area: 'okonomi', title: 'Beslut hvad I hellere vil bruge færre penge på' },
  { area: 'okonomi', title: 'Tjek hvad der er inkluderet i prisen og hvad der er tillæg' },
  { area: 'okonomi', title: 'Spørg til priser uden for højsæsonen' },
  { area: 'okonomi', title: 'Hold øje med hvad I reelt har brugt undervejs' },
  { area: 'okonomi', title: 'Sæt penge af til drikkepenge til personalet' },

  // ── Sted & overnatning ──
  { area: 'venue', title: 'Book overnatning til jer selv bryllupsnatten' },
  { area: 'venue', title: 'Aftal hvornår I må rykke ind dagen før' },
  { area: 'venue', title: 'Aftal hvornår leverandørerne må stille op' },
  { area: 'venue', title: 'Tjek om der er parkering nok til gæsterne' },
  { area: 'venue', title: 'Spørg til støjgrænser og sluttidspunkt' },
  { area: 'venue', title: 'Find overnatning til gæster langvejsfra' },
  { area: 'venue', title: 'Bestil transport mellem ceremoni og fest' },
  { area: 'venue', title: 'Aftal hvem der rydder op dagen efter' },
  { area: 'venue', title: 'Tjek adgangsforhold for gangbesværede gæster' },
  { area: 'venue', title: 'Læg en plan B hvis det regner' },
  { area: 'venue', title: 'Få styr på hvad stedet selv stiller med af borde og stole' },
  { area: 'venue', title: 'Book telt, varme og lys hvis I holder fest udendørs' },
  { area: 'venue', title: 'Tjek at der er strøm nok til band og køkken' },
  { area: 'venue', title: 'Aftal et sikkert sted hvor gaverne kan stå' },

  // ── Ceremoni & vielse ──
  { area: 'ceremoni', title: 'Book samtale med præsten eller vielsesforretteren' },
  { area: 'ceremoni', title: 'Vælg salmer eller musik til ceremonien' },
  { area: 'ceremoni', title: 'Aftal hvem der spiller eller synger under vielsen' },
  { area: 'ceremoni', title: 'Aftal pynt i kirken eller vielseslokalet' },
  { area: 'ceremoni', title: 'Spørg om der må fotograferes under vielsen' },
  { area: 'ceremoni', title: 'Beslut hvem der følger bruden ind' },
  { area: 'ceremoni', title: 'Aftal rækkefølgen når I går ud' },
  { area: 'ceremoni', title: 'Skriv jeres egne løfter hvis I vil sige noget selv' },
  { area: 'ceremoni', title: 'Skriv på invitationen hvornår gæsterne skal møde' },
  { area: 'ceremoni', title: 'Beslut om der skal kastes ris, blomster eller sæbebobler' },
  { area: 'ceremoni', title: 'Tjek om stedet tillader konfetti og riskast' },
  { area: 'ceremoni', title: 'Aftal hvem der pynter bilen' },
  { area: 'ceremoni', title: 'Aftal hvem der læser op under ceremonien' },
  { area: 'ceremoni', title: 'Øv jer i at gå ind i det tempo I gerne vil' },
  { area: 'ceremoni', title: 'Aftal et signal hvis I får brug for en pause' },
  { area: 'ceremoni', title: 'Spørg om der er en mikrofon I kan låne' },

  // ── Mad & drikke ──
  { area: 'mad', title: 'Aftal prøvesmagning med catering' },
  { area: 'mad', title: 'Saml gæsternes allergier og særlige hensyn' },
  { area: 'mad', title: 'Beslut om der skal være velkomstdrink' },
  { area: 'mad', title: 'Vælg vin til middagen' },
  { area: 'mad', title: 'Bestil alkoholfrie alternativer' },
  { area: 'mad', title: 'Aftal børnemenu' },
  { area: 'mad', title: 'Beslut om der skal serveres natmad' },
  { area: 'mad', title: 'Tjek om I selv skal levere drikkevarer' },
  { area: 'mad', title: 'Bestil kaffe, te og vand nok til hele aftenen' },
  { area: 'mad', title: 'Aftal hvem der skænker op under middagen' },
  { area: 'mad', title: 'Aftal hvor mange tjenere der er brug for' },
  { area: 'mad', title: 'Bestil kagebord eller dessertbuffet' },
  { area: 'mad', title: 'Aftal hvornår maden serveres i forhold til talerne' },
  { area: 'mad', title: 'Tjek om der også skal være mad til leverandørerne' },
  { area: 'mad', title: 'Beslut om der skal være snacks mens I fotograferes' },
  { area: 'mad', title: 'Aftal hvad der sker med maden der bliver tilovers' },
  { area: 'mad', title: 'Aftal servering af kaffe og avec' },

  // ── Tøj & styling ──
  { area: 'stil', title: 'Bestil vielsesringe' },
  { area: 'stil', title: 'Bestil gravering i ringene' },
  { area: 'stil', title: 'Hent ringene hos guldsmeden' },
  { area: 'stil', title: 'Book tilretning af kjolen hos en systue' },
  { area: 'stil', title: 'Hent kjolen fra systuen' },
  { area: 'stil', title: 'Book tid til hår og makeup' },
  { area: 'stil', title: 'Aftal prøvetid til hår og makeup' },
  { area: 'stil', title: 'Find sko og gå dem til' },
  { area: 'stil', title: 'Køb et par ekstra sko I kan holde til at danse i' },
  { area: 'stil', title: 'Vælg undertøj der passer til kjolen' },
  { area: 'stil', title: 'Bestil brudebuket' },
  { area: 'stil', title: 'Aftal knaphulsblomster til forlovere' },
  { area: 'stil', title: 'Find noget gammelt, nyt, lånt og blåt' },
  { area: 'stil', title: 'Læg en mønt i brudens sko' },
  { area: 'stil', title: 'Bestil manicure ugen før' },
  { area: 'stil', title: 'Aftal hvem der holder på ringene' },
  { area: 'stil', title: 'Aftal hvem der opbevarer kjolen dagen før' },
  { area: 'stil', title: 'Pak en nødtaske med plaster, nål og tråd' },
  { area: 'stil', title: 'Beslut om I skifter tøj til festen' },
  { area: 'stil', title: 'Køb tøj til dagen derpå' },

  // ── Foto & film ──
  { area: 'foto', title: 'Se hele bryllupper igennem hos fotografen, ikke kun de bedste billeder' },
  { area: 'foto', title: 'Aftal hvor mange timer fotografen er med' },
  { area: 'foto', title: 'Beslut om I vil have en videograf' },
  { area: 'foto', title: 'Beslut om I vil se hinanden inden ceremonien' },
  { area: 'foto', title: 'Find gode steder til portrætter i nærheden' },
  { area: 'foto', title: 'Læg portrætterne der hvor lyset er bedst' },
  { area: 'foto', title: 'Lav en navneliste til gruppebillederne' },
  { area: 'foto', title: 'Bed en i familien om at samle folk til gruppebillederne' },
  { area: 'foto', title: 'Tjek om der må flyves med drone på stedet' },
  { area: 'foto', title: 'Aftal hvornår I får billederne' },
  { area: 'foto', title: 'Aftal om fotografen må bruge billederne på nettet' },
  { area: 'foto', title: 'Beslut om gæsterne må tage billeder under ceremonien' },
  { area: 'foto', title: 'Lav et sted hvor gæsterne kan dele deres billeder' },
  { area: 'foto', title: 'Overvej engangskameraer eller en fotoboks' },
  { area: 'foto', title: 'Sørg for at fotografen får noget at spise' },
  { area: 'foto', title: 'Bestil album eller print når billederne er kommet' },

  // ── Papir & invitationer ──
  { area: 'papir', title: 'Saml postadresser på alle gæster' },
  { area: 'papir', title: 'Bestil frimærker til invitationerne' },
  { area: 'papir', title: 'Sæt en frist for svar på invitationen' },
  { area: 'papir', title: 'Følg op på gæster der ikke har svaret' },
  { area: 'papir', title: 'Skriv menukort' },
  { area: 'papir', title: 'Lav bordkort' },
  { area: 'papir', title: 'Lav en stor bordplan til opslag i festlokalet' },
  { area: 'papir', title: 'Beslut om der skal være program til ceremonien' },
  { area: 'papir', title: 'Lav sanghæfte til festen' },
  { area: 'papir', title: 'Sæt en frist for hvornår sange og taler skal sendes til jer' },
  { area: 'papir', title: 'Saml sange og taler ind fra gæsterne' },
  { area: 'papir', title: 'Lav skilte til vej og velkomst' },
  { area: 'papir', title: 'Print køreplanen til personalet' },
  { area: 'papir', title: 'Beslut om I vil sætte en annonce i lokalavisen' },
  { area: 'papir', title: 'Gør takkekort klar til efter brylluppet' },
  { area: 'papir', title: 'Vælg gæstebog eller et alternativ' },

  // ── Gæster & bordplan ──
  { area: 'gaester', title: 'Bliv enige om hvor mange I kan være' },
  { area: 'gaester', title: 'Skriv en A-liste og en B-liste over gæster' },
  { area: 'gaester', title: 'Beslut om børn er inviteret' },
  { area: 'gaester', title: 'Beslut om gæsterne må tage en med' },
  { area: 'gaester', title: 'Saml telefonnumre på gæsterne' },
  { area: 'gaester', title: 'Hold styr på hvem der har sagt ja og nej' },
  { area: 'gaester', title: 'Spørg til allergier allerede når gæsterne svarer' },
  { area: 'gaester', title: 'Placer gæsterne så ingen sidder alene' },
  { area: 'gaester', title: 'Beslut om I selv sidder ved et bord med andre' },
  { area: 'gaester', title: 'Placer de ældste gæster væk fra højttalerne' },
  { area: 'gaester', title: 'Sæt børnene sammen ved ét bord' },
  { area: 'gaester', title: 'Lav en aktivitetskurv til børnene' },
  { area: 'gaester', title: 'Aftal hvem der tager sig af gæster der ikke kender nogen' },
  { area: 'gaester', title: 'Send praktisk information ud ugen før' },
  { area: 'gaester', title: 'Fortæl gæsterne hvordan de skal klæde sig' },
  { area: 'gaester', title: 'Aftal hvem der planlægger polterabend' },
  { area: 'gaester', title: 'Læg polterabend på en dato der ikke er ugen før' },

  // ── Jura & praktik ──
  { area: 'jura', title: 'Udfyld ægteskabserklæringen på borger.dk' },
  { area: 'jura', title: 'Bestil prøvelsesattest hos kommunen' },
  { area: 'jura', title: 'Tjek at prøvelsesattesten stadig er gyldig på dagen' },
  { area: 'jura', title: 'Bestil tid til selve vielsen' },
  { area: 'jura', title: 'Find to vidner' },
  { area: 'jura', title: 'Beslut om I skifter efternavn' },
  { area: 'jura', title: 'Opret ægtepagt hvis I ønsker det' },
  { area: 'jura', title: 'Søg fri fra arbejde til bryllup og rejse' },
  { area: 'jura', title: 'Tjek at pas og navn matcher til bryllupsrejsen' },
  { area: 'jura', title: 'Bestil visum hvis bryllupsrejsen kræver det' },
  { area: 'jura', title: 'Veksl valuta til bryllupsrejsen' },
  { area: 'jura', title: 'Hæv kontanter til dem der skal have penge på dagen' },
  { area: 'jura', title: 'Aftal betaling og depositum med hver leverandør' },
  { area: 'jura', title: 'Opdater forsikringer efter brylluppet' },
  { area: 'jura', title: 'Meld navneændring til bank og arbejdsplads' },

  // ── Op til dagen ──
  { area: 'optil', title: 'Bekræft antal gæster over for stedet' },
  { area: 'optil', title: 'Send det endelige gæstetal til catering' },
  { area: 'optil', title: 'Ring rundt til alle leverandører ugen før' },
  { area: 'optil', title: 'Send adresse og tider til alle leverandører' },
  { area: 'optil', title: 'Læg en tidsplan for morgenen' },
  { area: 'optil', title: 'Aftal hvem der henter hvad dagen før' },
  { area: 'optil', title: 'Pak bilen dagen før' },
  { area: 'optil', title: 'Print alt det I skal bruge på dagen' },
  { area: 'optil', title: 'Tjek vejrudsigten ugen før' },
  { area: 'optil', title: 'Køb ind til velkomstkurve eller vandflasker' },
  { area: 'optil', title: 'Prøv hele outfittet på en sidste gang' },
  { area: 'optil', title: 'Gå til frisør et par uger før, ikke dagen før' },
  { area: 'optil', title: 'Book noget afslappende ugen før' },
  { area: 'optil', title: 'Sørg for at sove ordentligt de sidste par nætter' },
  { area: 'optil', title: 'Lad telefonerne op aftenen før' },
  { area: 'optil', title: 'Læg kontanter i kuverter til dem der skal have penge' },
  { area: 'optil', title: 'Giv én person ansvaret for spørgsmål på dagen' },
  { area: 'optil', title: 'Skriv en huskeliste til den der hjælper jer på dagen' },

  // ── Dagen selv ──
  { area: 'dagen', title: 'Lav en køreplan for dagen' },
  { area: 'dagen', title: 'Del køreplanen med alle leverandører' },
  { area: 'dagen', title: 'Aftal hvem der er toastmaster' },
  { area: 'dagen', title: 'Brief toastmasteren på hvem gæsterne er' },
  { area: 'dagen', title: 'Aftal hvem der holder tale og i hvilken rækkefølge' },
  { area: 'dagen', title: 'Øv jeres taler højt' },
  { area: 'dagen', title: 'Sørg for at nogen holder øje med tidsplanen' },
  { area: 'dagen', title: 'Vælg musik til jeres indgang' },
  { area: 'dagen', title: 'Vælg musik til første dans' },
  { area: 'dagen', title: 'Øv jeres første dans' },
  { area: 'dagen', title: 'Beslut hvornår brudevalsen skal danses' },
  { area: 'dagen', title: 'Aftal hvornår kagen skæres for' },
  { area: 'dagen', title: 'Beslut om brudebuketten skal kastes' },
  { area: 'dagen', title: 'Beslut om der skal klippes i gommens sokker' },
  { area: 'dagen', title: 'Lav en playliste til festen' },
  { area: 'dagen', title: 'Aftal hvem der passer børnene under festen' },
  { area: 'dagen', title: 'Aftal hvem der tager imod gaver' },
  { area: 'dagen', title: 'Aftal hvem der skriver ned hvem der har givet hvad' },
  { area: 'dagen', title: 'Lav en liste over billeder I gerne vil have' },
  { area: 'dagen', title: 'Sørg for mad til jer selv inden ceremonien' },
  { area: 'dagen', title: 'Pak en taske med skiftetøj og det I skal bruge om morgenen' },
  { area: 'dagen', title: 'Aftal hvem der samler tingene sammen til sidst' },
  { area: 'dagen', title: 'Aftal hvem der betaler leverandørerne på dagen' },
  { area: 'dagen', title: 'Beslut hvordan I kommer hjem bagefter' },

  // ── Efter brylluppet ──
  { area: 'efter', title: 'Hent gaver og jeres ting på festlokalet dagen efter' },
  { area: 'efter', title: 'Betal de sidste regninger til leverandørerne' },
  { area: 'efter', title: 'Send takkekort' },
  { area: 'efter', title: 'Giv en gave til dem der har hjulpet jer' },
  { area: 'efter', title: 'Bestil billederne hos fotografen' },
  { area: 'efter', title: 'Få brudebuketten tørret hvis I vil gemme den' },
  { area: 'efter', title: 'Læg et stykke kage i fryseren til jeres etårsdag' },
  { area: 'efter', title: 'Få kjolen renset og pakket ned' },
  { area: 'efter', title: 'Læg billederne op så gæsterne kan se dem' },
  { area: 'efter', title: 'Skriv en anmeldelse af de leverandører I var glade for' },
  { area: 'efter', title: 'Aflever lejede ting tilbage til tiden' },
  { area: 'efter', title: 'Sælg eller giv det væk I ikke skal bruge mere' },
  { area: 'efter', title: 'Ret navnet på sygesikringsbevis og kørekort' },
  { area: 'efter', title: 'Opdater testamente hvis I har et' },
  { area: 'efter', title: 'Sæt en aften af til at se billederne igennem sammen' },
  { area: 'efter', title: 'Læg en plan for hvordan I fejrer jeres etårsdag' },
];

/** Seed payload for `seedTasks`. Check items carry no date — they are grouped
 *  by area, not by time, so a date would only be noise. */
export function defaultChecklist() {
  return DEFAULT_CHECKLIST.map((item, i) => ({
    title: item.title,
    due_date: null,
    category: item.area,
    kind: 'check' as const,
    done: false,
    sort: i,
  }));
}

/**
 * The default items a couple does not have yet, matched on title. Used to
 * top up an existing checklist when this file grows: resetting would work too,
 * but it throws away every tick and every item they added themselves.
 *
 * `sort` continues after their highest existing value so the new rows land at
 * the bottom of their area instead of shuffling what is already there.
 */
export function missingChecklistItems(existing: { title: string; sort: number }[]) {
  const have = new Set(existing.map((r) => r.title));
  const from = existing.reduce((max, r) => Math.max(max, r.sort), -1) + 1;
  return DEFAULT_CHECKLIST.filter((item) => !have.has(item.title)).map((item, i) => ({
    title: item.title,
    due_date: null,
    category: item.area,
    kind: 'check' as const,
    done: false,
    sort: from + i,
  }));
}
