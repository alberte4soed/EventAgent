# Kalas — Content & Copy Pack

**Prepared by:** Content & Copy Lead
**Date:** 5 July 2026
**Status:** Draft for team review — all app copy changes below are *recommendations*, not code edits.

**Voice reference (keep this pinned):** Warm, calm, quietly confident. Ava is a capable friend, not a bot and not a butler. We never shout, never use scarcity theatrics, never say "revolutionary." We talk about the *feeling* of planning — the 40 open tabs, the unanswered emails — and the relief of handing that off. Danish copy is written natively for Danish couples ("I/jer"), never translated word-for-word.

---

## 1. Landing-page copy audit

### 1.1 Hero (`Hero.tsx`)

**Current copy:**

> Headline: **"Plan the wedding. Skip the stress."**
> Subhead: *"Tell Kalas about your wedding. It finds the venues, contacts them for you, compares the quotes, designs the invites and tracks every RSVP — so you can focus on each other."*
> CTAs: **"Plan my wedding — free"** / **"See how it works"**

**What works**

- The two-beat headline rhythm is right for the brand, and the dimmed "stress." (`text-white/55`) is a lovely typographic touch — the stress literally fades.
- "so you can focus on each other" is the single best line on the page. It's the emotional payoff and it's *ours* — no competitor ends on that note. Keep it, everywhere.
- "Plan my wedding — free" is a strong CTA: first-person, benefit-led, removes price anxiety.

**What to sharpen**

1. **"the wedding" is oddly impersonal for a wedding product.** It reads like planning someone else's event. One word fixes it:
   > **Proposed: "Plan your wedding. Skip the stress."**
   (If the six-word array constraint matters for the animation, "your" swaps in cleanly for "the".)
2. **The subhead switches persona.** The hero says "Kalas … It", but two scrolls later everything is "Ava … she." Pick one narrator sitewide — recommendation: *Kalas is the product, Ava is who you talk to*, and the hero should introduce her, because "she" converts curiosity better than "it":
   > **Proposed subhead:** *"Meet Ava. Tell her about your wedding and she finds the venues, writes to them from your own email, compares the quotes and chases the ones who go quiet — so you can focus on each other."*
   Note this version also surfaces two of our sharpest differentiators that the current subhead buries or omits: **"from your own email"** and **"chases the ones who go quiet."** "Designs the invites" and "tracks every RSVP" can live in the feature sections; the hero should sell the hardest, most unbelievable part (an agent that actually emails vendors) rather than list everything.
3. **No beta signal anywhere on the page.** We're in beta and Copenhagen-first — that's an asset, not a disclaimer. A small pill above the headline sets expectations and creates warmth:
   > **Proposed eyebrow pill:** *"In beta · planning weddings in Copenhagen first 🇩🇰"*
4. **Alt text is good** ("Outdoor wedding reception at sunset…") — no change. Nice to see accessibility already taken seriously.

---

### 1.2 Meet Ava scroll section (`MeetAva.tsx`)

**Current copy:**

> Section headline: **"She handles the wedding. *You stay in charge.*"**
> Step 1: *"Tell her what you're dreaming of — '120 guests, rustic, near Copenhagen, under 80k' — and she gets to work. You bring the vision and make the calls; Ava does the legwork."*
> Step 3 (outreach): *"She reaches out — so you don't email thirty people."* / *"Approve once, and Ava sends personalized inquiries to everyone you liked. She answers the back-and-forth, chases the vendors who go quiet, and keeps every thread organized."*
> Step 5 (budget): *"She watches the numbers."*
> Step 8 (timeline): *"She knows what's next."*

**What works — a lot, actually. This is the strongest section on the page.**

- "She handles the wedding. You stay in charge." is the correct positioning sentence for an AI agent product in 2026: capability + control in eight words. Don't touch it.
- The concrete example brief — *"120 guests, rustic, near Copenhagen, under 80k"* — does more selling than any adjective could. The "80k" quietly localizes to DKK without saying so.
- "so you don't email thirty people" and "chases the vendors who go quiet" name real pain in the customer's own language. These lines should be reused in ads (they are, below).
- Short declarative titles ("She watches the numbers." "She knows what's next.") have a calm confidence that matches the brand.

**What to sharpen**

1. **The website step is the weakest body copy** — *"Ava keeps your wedding website current — details, schedule, RSVPs — without you touching it."* It repeats the title ("always up to date" → "keeps current") and lists nouns without a scene. Proposed:
   > *"Change the ceremony time, add a dress code, move the dinner — tell Ava once, and your wedding website, invitations and guests all hear about it. No 'ignore my last email' texts."*
2. **The guests step buries its best feature.** "chase the maybes automatically" lives in `Features.tsx` but not here, where the guest story is actually told. Fold it in:
   > *"Guest list, RSVPs, meal choices and seating live in one place. Ava nudges the maybes so you don't have to text your cousin three times."*
3. **Minor: "make the calls" in step 1 is ambiguous** — in a vendor-outreach product, "calls" momentarily reads as *phone calls* (which Ava doesn't make). Suggest *"You bring the vision and make the decisions; Ava does the legwork."*
4. **Engineering flag (not copy):** both `MeetAva.tsx` and `Features.tsx` render `id="features"` — duplicate IDs mean the nav anchor only ever hits the first one. Worth a ticket.

---

### 1.3 Value band (`ValueBand.tsx`)

**Current copy:**

> Headline: **"The venue you want. Without the planning marathon."**
> Stats: **"12+** venues found per search" / **"1 email** from you — it sends the rest" / **"0** spreadsheets, calls or venue chasing"

**What works**

- "Without the planning marathon" is on-voice and true.
- The **1 → 0** stats are the good kind of number: they describe *effort*, which we control, not outcomes, which we don't. "0 spreadsheets, calls or venue chasing" is the best stat of the three.

**What to sharpen**

1. **"12+ venues found per search" is the weak sibling** — it's unverifiable-sounding, "12" is oddly specific yet unimpressive, and "per search" is product-internal language. Reframe around the user's time:
   > **Proposed: "1 chat — describe your wedding once" / "1 approval — Ava emails everyone you liked" / "0 spreadsheets, calls or vendor chasing"**
   A 1-1-0 run reads as a designed sequence rather than three random metrics. (Also swaps "venue chasing" → "vendor chasing" now that Ava covers caterers, photographers and florists.)
2. **Pronoun slip again:** "from you — *it* sends the rest" sits 300px below a section that says "she" fourteen times. If we keep a version of this stat, it's "she sends the rest."
3. **The headline is venue-only** while the product now sells the whole wedding. Alternative if we want the band to carry the full promise:
   > **Proposed: "The wedding you want. Without the second full-time job."**
   (Wedding planning is routinely described by couples as "a part-time job" — this phrase tests well in wedding communities and stays calm.)

---

### 1.4 How Ava works (`HowAvaWorks.tsx`)

**Current copy:**

> Eyebrow: **"How it works"** · Headline: **"How Ava works."**
> Subhead: *"Four steps — tell her about your wedding, she works in the background, she comes back with things to approve, you decide and she executes. She works; you decide."*
> Steps: "Tell her about your wedding" → "She works in the background" → "She comes back with things to approve" → "You decide, she executes"
> Control block: **"Ava does it. You oversee it."** — *"…Open the app on your lunch break, clear her suggestions in five minutes, and get on with your day."*

**What works**

- The four-step loop itself is excellent — it's the honest mental model of an agent product, and "You decide, she executes" is a keeper.
- The lunch-break line is the most *visual* sentence on the page. It converts because the reader can see themselves doing it. Protect it.

**What to sharpen**

1. **The subhead is the page's one genuinely bad paragraph.** It reads the four step titles out loud, then repeats itself ("you decide and she executes. She works; you decide."). It's a summary of a summary. Proposed replacement:
   > *"You'll never wonder what Ava is doing — everything she prepares waits for your yes."*
   One line, adds new information (transparency + consent), lets the cards do the walking.
2. **Eyebrow/headline redundancy:** "How it works" directly above "How Ava works." says the same thing twice. Either give the eyebrow a different job (*"The planning loop"*) or make the headline earn its space: **"Four steps, on repeat, until you're married."** — which also tells the reader the loop *ends*, a quiet reassurance monthly-subscription skeptics need.
3. "Ava sends, books, updates, and moves to the next item" — confirm "books" with product. If Ava doesn't yet complete bookings in beta, soften to *"sends, follows up, updates"*; overclaiming here is exactly where trust breaks.

---

### 1.5 Features grid (`Features.tsx`)

**Current copy:**

> Eyebrow: **"One agent, your whole wedding"** · Headline: **"Everything a wedding needs — *handled.*"**
> Cards include: *"Kalas searches the live web for real venues…"*, *"…emails every venue you liked from your own Gmail — personalised, polite, and signed by you."*, *"…no spreadsheet, no phone tag."*, *"Kalas drafts beautiful wedding invitations matched to your style…"*

**What works**

- **"personalised, polite, and signed by you"** is a gem — it pre-answers the fear ("will an AI embarrass me in front of vendors?") in six words. Reuse in ads and onboarding.
- "from your own Gmail" is the trust differentiator; good that it's explicit here.
- "no spreadsheet, no phone tag" — keep.

**What to sharpen**

1. **This whole section is 70% redundant with Meet Ava** — search, outreach, quotes, and RSVPs are all covered above, in stronger scroll-driven form, with a different narrator ("Kalas/it" here vs "Ava/she" there). Recommendation: either **cut this section** and move its two unique cards (Invites, RSVPs) into Meet Ava, or **repurpose it as the objection-handling section** the page currently lacks: "Your email, your voice" / "Nothing sends without you" / "Real vendors, real listings" / "Built for Denmark, in Danish and English" / "Cancel anytime" / "Your data stays yours." Every agent product needs a trust grid more than a second feature grid.
2. If it stays as features: change every "Kalas … it" to "Ava … she", and align "Finds the right venues" with the broader vendor promise ("Finds the right vendors").
3. "searches the live web" is engineer-speak. Couples don't fear a stale web; they fear fake listings. *"searches real, current listings"* says the same thing in their dialect.

---

### 1.6 Pricing (`Pricing.tsx`)

**Current copy:**

> Headline: **"Plans."**
> Subhead: *"Free to start, transparent tiers, no surprises. Upgrade when you're ready to hand Ava the full wedding."*
> Tiers: **Starter — Free** *"Tell Ava about your wedding and start finding venues."* / **Complete — DKK 499/mo** *"Everything you need from venue to last RSVP."* / **Premium — DKK 899/mo** *"White-glove planning with priority support."*
> CTAs: "Start free" / "Get started" / "Talk to us"

**What works**

- "Upgrade when you're ready to hand Ava the full wedding" is a genuinely good upgrade framing — the product itself is the pitch.
- "Everything you need from venue to last RSVP" is a tidy tier description.
- Free tier with real utility (5 outreach emails) is the right shape; the copy honestly reflects it.

**What to sharpen**

1. **"Plans." is a missed emotional beat.** It's minimal to the point of mute. We're asking Danish couples for 499 kr/month — earn it with one warm line:
   > **Proposed headline: "Less than one centerpiece a month."**
   > (Fallback if too cheeky: **"Simple plans for a simple(er) wedding."** or keep-it-calm: **"Pricing."** with a stronger subhead.)
2. **Answer the math couples actually do.** A monthly price for a finite project makes people multiply. Say it for them, proudly:
   > **Proposed line under the grid:** *"Most couples plan for 8–12 months — around DKK 4–6,000 all-in for Complete. The average Danish wedding planner charges 10× that. Cancel anytime, including the week after the wedding."*
   (Legal/finance to verify the planner comparison before shipping; the cancel-anytime promise is the load-bearing part.)
3. **"White-glove" clashes with the brand voice** — it's luxury-concierge English that means little in Denmark. Proposed Premium description: *"For couples who want it fully handled — Ava plus priority everything, and a human onboarding call."*
4. **Consistency flags:** Premium's CTA says "Talk to us" but links to `/login` like the others — either wire a contact flow or say "Get started." And the highlighted/non-highlighted button classes are identical (`bg-blue` both branches), so the featured tier's CTA doesn't actually stand out — likely unintended.
5. Starter's description is venue-only ("start finding venues") but its features include quote comparison and outreach — *"Tell Ava about your wedding and send your first inquiries — free."* sells the tier's real edge.

---

### 1.7 Final CTA (`FinalCTA.tsx`)

**Current copy:**

> Headline: **"Your wedding day, *basically planned already.*"**
> Subhead: *"Sign in with Google and tell Kalas about your wedding. The first venue quotes can be in your inbox today."*
> CTA: **"Start planning your wedding — it's free"**

**What works**

- **"The first venue quotes can be in your inbox today"** is the best conversion line on the page — concrete, time-bound, believable. Do not touch it; build ads around it (see §3).
- "Sign in with Google" pre-answers "how much setup?" Good.

**What to sharpen**

1. **"basically planned already" wobbles.** "Basically" is doing hedge-work and charm-work at once, and the claim is technically false at signup. Two directions:
   - Keep the wink, sharpen the truth: **"Your wedding, off your plate by tonight."**
   - Or mirror the hero for a bookend: **"Skip the stress. Keep the wedding."**
2. The subhead still says "Kalas … " where the entire page has been about Ava. *"Sign in with Google and tell Ava about your wedding. The first venue quotes can be in your inbox today."*
3. Consider one line of beta social proof above the CTA (we have `BetaUserCounter.tsx` — use it here): *"Planning alongside 214 couples in the beta."* Numbers pulled live, never faked.

---

### 1.8 Cross-cutting recommendations (priority order)

1. **One narrator.** Ava/she everywhere a human-feeling action happens; Kalas is the product name in nav, pricing, legal. Currently Hero and Features say "it," everything else says "she."
2. **Say "beta" once, warmly.** Hero pill + FinalCTA counter. Beta framing buys forgiveness and makes early users feel like insiders — our whole social strategy (§2) depends on it.
3. **Add the missing trust section** (repurposed Features grid, §1.5). "Sends email as me" is the scariest sentence in the product; the page never directly calms it.
4. **Danish page parity.** Everything above needs a native DA twin, not a translation pass — e.g. hero: **"Planlæg jeres bryllup. Spring stressen over."**, Meet Ava: **"Hun klarer brylluppet. I bestemmer."** (Da: couples are addressed as "I/jer" — never "du" on wedding surfaces.)
5. **Verify every capability claim against beta reality** ("books," "designs the invites," "sends them to your guest list"). One overclaim discovered by a beta user costs more than ten features unlisted.

---

## 2. Social content — 4-week IG/TikTok starter calendar

**Cadence:** 3 posts/week. **Handle voice:** Ava speaks in first person sometimes; the team speaks as "we." **Recurring formats:** *"Ava did it" demos* (screen recordings), *pain-point reels* (POV/relatable), *beta diary* (behind-the-scenes, founder-facing). **Language mix:** ~half DA, half EN; DA posts carry the local hashtags (#bryllup2026 #dkbryllup #bryllupdk #københavnerbryllup), EN posts the global ones (#weddingplanning #weddingtech #aiwedding).
**Always-on story bits:** Monday poll ("What's your most-dreaded wedding task?"), Friday "quotes that came in this week" (anonymized screenshots, vendor names blurred).

### Week 1 — Introduce the pain, introduce Ava

**Post 1 · Reel (DA) — pain point**
- **Hook (on-screen, first frame):** "POV: I er lige blevet forlovet, og nu har du 40 faner åbne med 'festlokaler københavn'"
- **Format:** POV reel — screen recording of chaotic tab-hopping, sighing, spreadsheet with 3 half-filled rows. Hard cut to a single calm Kalas chat: *"120 gæster, rustik, nær København, under 80.000."* Trending calm-piano audio.
- **Caption:** "Forlovelsen: magisk ✨ Planlægningen: et deltidsjob, ingen har søgt. Vi bygger Kalas, fordi det ikke behøver være sådan. Fortæl Ava om jeres bryllup — hun finder stederne, skriver til dem fra jeres egen mail og samler tilbuddene ét sted. Gratis at prøve, link i bio. 🇩🇰 Vi er i beta og starter i København. #bryllup2026 #bryllupdk #forlovet #københavnerbryllup"

**Post 2 · Carousel (EN) — meet Ava**
- **Hook (slide 1):** "This is Ava. She's about to email 9 wedding venues so you don't have to."
- **Format:** 6-slide carousel: (1) hook, (2) the chat brief, (3) the swipe deck, (4) the one email you approve, (5) inbox filling with replies, (6) quotes side by side + "Plan my wedding — free".
- **Caption:** "Meet Ava, the planner inside Kalas. You describe the wedding once. She searches real venues, you swipe the ones you like, you approve *one* message — and she sends a personalised version to every venue, from your own Gmail, signed by you. Then she chases the ones who go quiet (there are always ones who go quiet). We're in beta in Copenhagen. Link in bio if you'd like her on your side. #weddingplanning #weddingtok #aiwedding #copenhagenwedding"

**Post 3 · Story series (DA) — poll + soft CTA**
- **Frames:** (1) Poll: "Hvad frygter I mest ved bryllupsplanlægning? 🗳️ At finde stedet / Budgettet / At skrive til leverandører / Gæstelisten" (2) Result-tease frame next day: "'At skrive til leverandører' vinder hver gang. Det er bogstaveligt talt Avas yndlingsopgave." (3) Link frame: "Prøv gratis → kalas.dk"

### Week 2 — "Ava did X" proof

**Post 4 · Reel (EN) — demo, the money shot**
- **Hook:** "I asked an AI to find my wedding venue. 20 minutes later, this happened."
- **Format:** Real-time-feeling screen recording: brief typed → venue cards appear → swipe right ×6 → approve one email → cut to Gmail *Sent* folder showing 6 personalised emails → cut to first reply. Timestamp overlays ("0:00 → 0:20").
- **Caption:** "No stock footage, this is the actual product (beta, Copenhagen). The part people don't believe: the emails go from *your* Gmail, in your name, and Ava reads the replies and puts the quotes side by side. The first quotes can be in your inbox today. Link in bio. #weddingtech #aiagent #weddingplanning #betalife"

**Post 5 · Carousel (DA) — quote comparison**
- **Hook (slide 1):** "3 tilbud på festlokale. Ét skema. Nul regneark."
- **Format:** Carousel of the (anonymized) quote table: pris, dato, hvad er med / ikke med. Sidste slide: "Ava læste mails'ene. I traf valget."
- **Caption:** "Det sværeste ved tilbud er ikke at få dem — det er at sammenligne dem, når det ene er pr. kuvert, det andet en pakkepris, og det tredje 'vender tilbage'. Ava trækker pris, dato og indhold ud af hver mail og stiller dem op side om side. #bryllupsbudget #bryllupdk #festlokale #bryllup2026"

**Post 6 · Story (EN) — beta diary #1**
- **Frames:** (1) Desk photo, honest caption: "Beta week 9. A vendor replied to Ava's follow-up with 'thanks for the reminder, we get so many emails' — the chase-up feature is earning its keep." (2) Screenshot of the (blurred) reply. (3) Question sticker: "Beta couples: what should Ava learn next?"

### Week 3 — pain points deepen, Danish focus

**Post 7 · Reel (DA) — the ghosting problem**
- **Hook:** "Når festlokalet ikke har svaret i 12 dage 🥲"
- **Format:** Relatable acting reel — checking phone, refreshing inbox, drafting an awkward "gentle reminder"-mail, deleting it. Cut to Kalas: *"Ava har lige rykket Møllegården for svar."* notification.
- **Caption:** "At rykke leverandører for svar er det mest akavede i hele planlægningen — så det gør Ava for jer. Venligt, professionelt og lige tilpas vedholdende. I skal aldrig skrive 'jeg tillader mig lige at følge op…' igen. Gratis at komme i gang, link i bio. #bryllupsplanlægning #bryllupdk #leverandører #forlovet2026"

**Post 8 · Carousel (DA) — budget realism**
- **Hook (slide 1):** "Hvad koster et bryllup i Danmark egentlig? Tal, ikke gæt."
- **Format:** 7 slides med gennemsnitspriser pr. kategori (lokale, catering pr. kuvert, fotograf, blomster…), kilder angivet, sidste slide: Kalas' budgetoverblik der opdaterer sig selv. (Data fra vores SEO-artikel #2, §5 — genbrug!)
- **Caption:** "Ingen fortæller jer, hvad tingene koster, før tilbuddene lander — så her er de tal, vi ser på tværs af rigtige tilbud i betaen (anonymiseret). Gem opslaget til budgetsnakken. 💛 Kalas holder selv regnskabet, mens tilbuddene kommer ind. #bryllupsbudget #hvadkosteretbryllup #bryllupdk"

**Post 9 · Reel (EN) — founder/behind-the-scenes**
- **Hook:** "Things Danish wedding vendors have said to our AI (without knowing it drafted the email)"
- **Format:** Text-on-screen reel, 4–5 real (anonymized, permissioned) reply snippets: "What a lovely enquiry, so well organised!" etc. End card: "personalised, polite, and signed by you."
- **Caption:** "The bar for wedding inquiries is 'copy-pasted the same email to 15 venues' — so Ava clears it easily. Every inquiry is personalised to the venue, sent from the couple's own email, in their name. Vendors reply faster to good emails. That's the whole trick. #weddingtech #betadiary #copenhagen"

### Week 4 — social proof + conversion push

**Post 10 · Reel (DA) — beta couple story (UGC-style)**
- **Hook:** "Vi fik 5 tilbud på festlokaler på 3 dage — uden at skrive én mail selv."
- **Format:** Beta-par (eller voiceover over deres skærm, med samtykke) fortæller forløbet: brief → swipe → godkend → tilbud. Ægte, uredigeret tone.
- **Caption:** "Tusind tak til [par] for at dele deres forløb fra betaen 💛 Sådan ser det ud, når Ava klarer benarbejdet: I beskriver brylluppet én gang, swiper jer gennem stederne og godkender én besked. Resten ordner hun. Vi lukker løbende flere par ind i betaen — link i bio. #bryllupdk #ægtepar2026 #betatest #københavnerbryllup"

**Post 11 · Carousel (EN) — objection handling**
- **Hook (slide 1):** "'I'm not letting an AI email my wedding vendors.' Fair. Read this first."
- **Format:** 5 slides: (1) hook, (2) "Nothing sends without your approval — ever", (3) "It's your Gmail, your name, your sign-off", (4) "You see every thread, every reply", (5) "You decide. She executes." + CTA.
- **Caption:** "The most common question we get, answered honestly: Ava never sends anything you haven't approved. You review the message, you see every reply, and you can take over any thread at any time. She handles the wedding — you stay in charge. #aiagent #weddingplanning #trust #weddingtech"

**Post 12 · Story series (DA) — countdown/conversion**
- **Frames:** (1) "Månedens tal fra betaen: 🧾 214 forespørgsler sendt · 87 tilbud modtaget · 0 regneark oprettet" (2) Countdown sticker: "Næste beta-hold lukkes ind på søndag" (3) Link: "Skriv jer op → kalas.dk" *(only run the countdown if the cohort gate is real — no fake scarcity, it's off-brand).*

---

## 3. Ad copy

### 3.1 Meta (Facebook/Instagram) — 5 variants

*Targeting notes: DK, 24–40, engaged (relationship status + engagement-adjacent interests), Copenhagen + Sjælland first. Variants 1–3 prospecting, 4 retargeting, 5 DA broad. All CTAs → "Sign Up" / "Tilmeld dig".*

**Variant 1 (EN) — Pain/relief, prospecting**
- **Primary text:** "Planning a wedding shouldn't feel like a second job. Tell Ava — the planner inside Kalas — about your day ("120 guests, rustic, near Copenhagen") and she finds real venues, emails them from your own Gmail, and lays the quotes side by side. You approve everything. She does the legwork. Free to start, built in Denmark."
- **Headline:** "Your wedding, off your plate"
- **Description:** "The first venue quotes can be in your inbox today."
- **Creative direction:** The Week 2 demo reel (§2 Post 4), cut to 15s.

**Variant 2 (DA) — The awkward follow-up, prospecting**
- **Primary text:** "I skal aldrig skrive 'jeg tillader mig lige at følge op…' igen. Ava finder festlokaler og leverandører, der passer til jeres bryllup, skriver personligt til dem fra jeres egen mail — og rykker venligt dem, der ikke svarer. I godkender alt. Hun klarer resten. Gratis at komme i gang."
- **Headline:** "Ava rykker leverandørerne for jer"
- **Description:** "Bryllupsplanlægning uden 40 åbne faner. Bygget i Danmark, i beta nu."
- **Creative direction:** Ghosting-reel (§2 Post 7) or a still of the follow-up notification.

**Variant 3 (EN) — Trust/control, prospecting (colder audiences)**
- **Primary text:** "'I'm not letting an AI email my vendors.' Fair — so here's how Kalas actually works: Ava drafts, you approve, and every inquiry goes from your own Gmail, in your name, personalised and polite. She reads the replies, extracts the quotes, and chases the silent ones. Nothing ever sends without you. She handles the wedding. You stay in charge."
- **Headline:** "You decide. She executes."
- **Description:** "Free to start · in beta in Copenhagen"
- **Creative direction:** Objection carousel (§2 Post 11) as a carousel ad.

**Variant 4 (EN) — Retargeting site visitors / signups without Gmail connect**
- **Primary text:** "Still comparing venues in a spreadsheet? You already met Ava — let her finish the job. Approve one message and she'll email every venue on your shortlist tonight. The first quotes can be in your inbox tomorrow morning."
- **Headline:** "Your shortlist is waiting"
- **Description:** "One approval. Ava sends the rest."
- **Creative direction:** Quote-comparison table screenshot, anonymized.

**Variant 5 (DA) — Broad emotional, prospecting**
- **Primary text:** "Fortæl Ava om jeres bryllup — hvor mange gæster, hvilken stemning, hvilket budget. Hun finder stederne, indhenter tilbuddene og holder styr på både budget og gæsteliste, så I kan bruge forlovelsen på hinanden i stedet for på regneark. Gratis at prøve. I bestemmer alt; hun gør arbejdet."
- **Headline:** "Planlæg brylluppet. Behold roen."
- **Description:** "Danmarks AI-bryllupsplanlægger · gratis at starte"
- **Creative direction:** Hero-style warm imagery + 3-beat product flash (chat → swipe → tilbud).

### 3.2 Google RSA — 5 sets (headlines ≤30 chars, descriptions ≤90 chars)

**Set 1 — Query cluster: "bryllupslokaler københavn", "festlokaler bryllup københavn" (DA)**
- Headlines: "Bryllupslokaler i København" · "Find jeres bryllupssted" · "Ava skriver til stederne" · "Tilbud samlet side om side" · "Gratis at komme i gang" · "Swipe jer til en shortlist" · "Fra egen mail — i jeres navn" · "Slip for 40 åbne faner"
- Descriptions: "Beskriv brylluppet én gang. Ava finder lokaler, der passer til gæster, stil og budget." · "I godkender én besked — Ava sender personlige forespørgsler til alle jeres favoritter." · "Tilbuddene samles automatisk side om side: pris, dato og hvad der er med." · "Bygget i Danmark. Gratis at starte — de første tilbud kan lande i dag."

**Set 2 — Query cluster: "hvad koster et bryllup", "bryllup budget" (DA)**
- Headlines: "Hvad koster jeres bryllup?" · "Styr på bryllupsbudgettet" · "Ægte tilbud, ægte priser" · "Budget der opdaterer sig selv" · "Sammenlign tilbud ét sted" · "Gratis bryllupsplanlægger" · "Ava holder øje med tallene" · "Ingen regneark. Lovet."
- Descriptions: "Få rigtige tilbud fra rigtige leverandører — og se dem side om side, før I beslutter jer." · "Kalas tracker depositum, betalinger og aftaler mod jeres samlede budget. Helt automatisk." · "Ava advarer jer, før noget skubber budgettet over. I bestemmer — hun regner." · "Start gratis: fortæl Ava om brylluppet, og få de første tilbud i indbakken i dag."

**Set 3 — Query cluster: "bryllupsplanlægger", "hjælp til bryllupsplanlægning", "bryllupsplanlægger pris" (DA)**
- Headlines: "Jeres AI-bryllupsplanlægger" · "Bryllupsplanlægger fra 0 kr." · "Hun klarer benarbejdet" · "I bestemmer. Ava udfører." · "Rykker leverandører for svar" · "Fra lokale til sidste RSVP" · "Prøv gratis i dag" · "Bygget til danske bryllupper"
- Descriptions: "En planlægger til en brøkdel af prisen: Ava finder, kontakter og følger op på leverandører." · "Gæsteliste, budget, tidsplan og bryllupshjemmeside — samlet ét sted og altid opdateret." · "Intet sendes uden jeres godkendelse. Ava arbejder; I har det sidste ord." · "Gratis at starte. Fuld planlægning fra 499 kr./md. — opsig når som helst."

**Set 4 — Query cluster: "bryllupssteder sjælland", "lade bryllup", "bryllup på slot" (DA)**
- Headlines: "Bryllupssteder på Sjælland" · "Lader, godser og strandhoteller" · "Fortæl Ava jeres drøm" · "Personlige forespørgsler" · "Svar og tilbud samlet ét sted" · "Gratis at prøve" · "Shortlist på minutter" · "Rustikt, klassisk eller kyst?"
- Descriptions: "'120 gæster, rustik lade, under 80.000' — Ava finder stederne, der matcher jeres brief." · "Swipe jer gennem rigtige steder med billeder og fakta — højre for shortlist, venstre for nej tak." · "Ava mailer alle jeres favoritter fra jeres egen mail og samler tilbuddene automatisk." · "I beta i København og på Sjælland. Gratis at komme i gang."

**Set 5 — Query cluster (EN expat/international): "wedding planner copenhagen", "wedding venues denmark english"**
- Headlines: "Plan a Wedding in Denmark" · "Copenhagen Wedding Venues" · "Ava Emails Vendors for You" · "Quotes Compared Side by Side" · "Free to Start" · "In English & Danish" · "You Approve, She Sends" · "No Spreadsheets, No Phone Tag"
- Descriptions: "Getting married in Denmark? Ava finds real venues and writes to them in flawless Danish." · "Describe your wedding once. Swipe a shortlist. Approve one email — Ava sends the rest." · "She reads every reply, extracts prices and dates, and chases vendors who go quiet." · "Built in Copenhagen, works in English and Danish. The first quotes can arrive today."

---

## 4. Email lifecycle

*All emails: sender "Ava from Kalas <ava@kalas.dk>", warm plain-text-leaning design, one CTA each. English body drafts below; each carries a Danish subject-line variant (full DA body versions to follow the same structure once EN is approved).*

### 4.1 Welcome sequence

**Email 1 — immediately after signup**
- **Subject (EN):** "Hi, I'm Ava — tell me about your wedding"
- **Subject (DA):** "Hej, jeg er Ava — fortæl mig om jeres bryllup"
- **Preheader:** "Two minutes now, real venue options today."

> Hi {{first_name}},
>
> I'm Ava — I'll be doing the legwork on your wedding from here on.
>
> Here's how this works: you tell me about your day in plain words — something like *"120 guests, rustic, near Copenhagen, under 80k"* — and I go find real venues that fit. You swipe through them, keep the ones you like, and when you're ready, I'll write to all of them for you.
>
> You don't need a plan, a date, or even a guest count yet. A rough idea is plenty; I'll ask about the rest as we go.
>
> **[Tell me about your wedding →]**
>
> One promise before we start: I never send anything — not an email, not an invitation — without your approval. You decide; I execute.
>
> Talk soon,
> Ava
>
> *P.S. Kalas is in beta, which means you get a real say in what I learn next. Just reply to this email — a human on the team reads every one.*

**Email 2 — day 2 (if no venue search yet) / day 4 (otherwise)**
- **Subject (EN):** "The one email you'll actually have to write"
- **Subject (DA):** "Den eneste mail, I selv skal skrive"
- **Preheader:** "Approve it once — I'll personalise and send the rest."

> Hi {{first_name}},
>
> The part of wedding planning couples dread most isn't choosing — it's the outreach. Writing to fifteen venues, keeping track of who answered, nudging the ones who didn't.
>
> Here's my favourite part of the job: you approve **one** message, and I send a personalised version to every venue you shortlisted — from your own Gmail, in your name, polite and specific to each place. Vendors reply faster to good emails. Then I watch the replies, pull out the prices and dates, and line the quotes up side by side for you.
>
> {{#if has_shortlist}}You already have {{shortlist_count}} venues shortlisted — you're one approval away from real quotes.{{else}}It starts with a shortlist — describe your wedding and I'll find your first candidates in a couple of minutes.{{/if}}
>
> **[{{#if has_shortlist}}Review your inquiry →{{else}}Find your venues →{{/if}}]**
>
> — Ava

**Email 3 — day 6**
- **Subject (EN):** "What I can take off your plate (the full list)"
- **Subject (DA):** "Alt det, I kan lægge fra jer (hele listen)"
- **Preheader:** "Venues are just the beginning."

> Hi {{first_name}},
>
> Most couples meet me through venue hunting, but that's chapter one. Here's everything I can carry:
>
> - **Vendors, all of them** — caterers, photographers, florists. Same flow: I search, you swipe, I write.
> - **The chasing** — I follow up with anyone who goes quiet, so you never have to draft an awkward reminder.
> - **The budget** — every deposit and commitment tracked against your total, with a heads-up before anything pushes you over.
> - **Guests** — list, RSVPs, meal choices, seating. I nudge the maybes.
> - **Your wedding website** — always current, without you touching it.
> - **The timeline** — I'll tell you when it's time to book the photographer, before it's suddenly too late.
>
> The free plan covers your venue search and first five inquiries. When you're ready to hand me the whole wedding, Complete is DKK 499/month — and you cancel whenever you like, including the week after the wedding.
>
> **[See what's next on your wedding →]**
>
> — Ava

### 4.2 "First inquiry sent" celebration email — triggered on first outreach batch

- **Subject (EN):** "Sent 🎉 Your inquiries are on their way"
- **Subject (DA):** "Sendt 🎉 Jeres forespørgsler er afsted"
- **Preheader:** "{{venue_count}} personalised emails, from your Gmail, just now."

> {{first_name}} — it's done. 🎉
>
> A minute ago, {{venue_count}} venues each received a personalised inquiry about your wedding — sent from your own Gmail, in your name. (Check your Sent folder if you'd like to admire them. I would.)
>
> **What happens now:**
>
> 1. **Replies usually start within 1–3 days.** I'm watching your inbox — the moment a quote lands, I'll extract the price, dates and what's included, and add it to your comparison.
> 2. **If anyone goes quiet for a week,** I'll send a friendly follow-up. You'll never have to chase.
> 3. **You'll see everything** on your dashboard, and I'll ping you when there's something worth a decision.
>
> Until then? Genuinely: go do something that isn't wedding planning. That's the whole point of me.
>
> **[See your outreach dashboard →]**
>
> Proud of us,
> Ava

### 4.3 Win-back email — user inactive 14+ days with an unfinished flow

- **Subject (EN):** "Your shortlist is still here (and so am I)"
- **Subject (DA):** "Jeres shortlist venter stadig (og det gør jeg også)"
- **Preheader:** "Pick up exactly where you left off — nothing was lost."

> Hi {{first_name}},
>
> No guilt, I promise — wedding planning is a thing people rightly put down and pick back up. I just wanted you to know that nothing you did has gone anywhere:
>
> {{#if has_shortlist}}- Your shortlist of {{shortlist_count}} venues is saved and waiting.{{/if}}
> {{#if has_draft}}- Your inquiry draft is ready — one approval and it goes out tonight.{{/if}}
> {{#if has_quotes}}- You have {{quote_count}} quotes sitting side by side, ready to compare.{{/if}}
>
> If life got busy, here's the good news: busy is my department. Ten minutes on your phone — a couple of swipes, one approval — and I'll take it from there again.
>
> **[Pick up where we left off →]**
>
> And if plans changed — a different city, a longer engagement, or you've found your venue elsewhere — just reply and tell me. I'll adjust, or I'll cheer for you and get out of the way.
>
> — Ava

### 4.4 Beta-invite email — to waitlist signups

- **Subject (EN):** "You're in — welcome to the Kalas beta"
- **Subject (DA):** "I er med — velkommen til Kalas-betaen"
- **Preheader:** "Your invite is live. Copenhagen couples, this way."

> Hi {{first_name}},
>
> Good news: a spot opened up, and it's yours. You're officially part of the Kalas beta. 🎉
>
> Quick honesty about what "beta" means here:
>
> - **The core works, and it's the good part.** Describe your wedding, swipe real venues, approve one message — and Ava (that's me) emails every venue you liked from your own Gmail, then collects the quotes side by side.
> - **Some edges are still soft.** You might catch an odd venue suggestion or a clumsy phrasing. Tell us — beta couples have already shaped half of what I do.
> - **You get a direct line.** Reply to any email from me and a human on the team reads it, usually same-day.
> - **Beta couples keep beta pricing.** Whatever plan you're on when we launch, your price stays.
>
> Your invite link is below — it's personal to you and works for two weeks. All you need is a Google account and roughly two minutes.
>
> **[Accept your invite →]**
>
> Let's plan a wedding,
> Ava
>
> *P.S. We're starting in Copenhagen and spreading out from there — if your wedding is elsewhere in Denmark, I can already search there too; my vendor coverage is just thickest in the capital for now.*

---

## 5. SEO starter — 10 article briefs

*Shared rules: Danish articles written natively in Danish (these briefs are in English for the team; the articles themselves are DA unless marked EN). Kalas appears once mid-article as a genuinely useful aside and once in a soft outro CTA — never in the intro, never more than twice. Every article must be independently excellent without the product.*

**1. "Bryllupslokaler i København: 25 steder fra rå industrilofter til klassiske palæer (2026)"**
- **Target query:** "bryllupslokaler københavn" (+ "festlokaler bryllup københavn")
- **Angle:** The definitive, honest local roundup — capacity, price range, style, and the one thing each venue's couples always mention. Organized by vibe, not alphabet. Updated quarterly (freshness is the moat).
- **Kalas weave-in:** After the list: "Shortlisted a few? The slow part is writing to them all — this is exactly the job we built Ava for; she'll email each one a personalised inquiry from your own Gmail." Outro CTA only.

**2. "Hvad koster et bryllup i Danmark i 2026? Rigtige tal, post for post"**
- **Target query:** "hvad koster et bryllup" (+ "bryllup pris")
- **Angle:** Real, sourced numbers per category (venue, catering per kuvert, photographer, flowers, dress, music) with lav/typisk/høj bands — anonymized aggregates from actual beta quotes make this uncopyable. The article every engaged Dane screenshots.
- **Kalas weave-in:** One line under the methodology: prices come from real quotes gathered through Kalas — which is also the easiest way to find out what *your* wedding costs.

**3. "Sådan skriver I en forespørgsel til et festlokale (skabelon + hvad stederne selv siger)"**
- **Target query:** "forespørgsel festlokale" / "mail til bryllupslokale"
- **Angle:** A copy-paste inquiry template plus interviews with 3–4 Copenhagen venue managers on what makes them answer fast (guest count! date range! budget honesty!). Genuinely giving away what Ava does builds trust, not cannibalization.
- **Kalas weave-in:** "Or skip the copy-paste: Ava writes a personalised version of this email to every venue on your list and tracks who answers."

**4. "Tidslinje for bryllupsplanlægning: hvad skal ske hvornår (12-måneders tjekliste)"**
- **Target query:** "bryllupsplanlægning tjekliste" / "bryllup tidsplan"
- **Angle:** Month-by-month checklist calibrated to Danish realities (popular venues book 12–18 months out; summer Saturdays go first). Printable/saveable asset for link equity.
- **Kalas weave-in:** Midway aside: Kalas runs this exact timeline in the background and nudges you when a deadline approaches.

**5. "Bryllupssteder på Sjælland: lader, godser og strandhoteller uden for København"**
- **Target query:** "bryllupssteder sjælland" (+ "lade bryllup sjælland")
- **Angle:** The escape-the-city companion to article 1 — sorted by drive time from Copenhagen, with honest notes on transport/overnatning logistics that couples forget.
- **Kalas weave-in:** Outro CTA mirroring article 1.

**6. "Bryllupsfotograf: hvad koster det, og hvad skal I spørge om? (2026-priser)"**
- **Target query:** "bryllupsfotograf pris"
- **Angle:** Price bands (timepris vs heldagspakker), what's actually included, the 8 questions to ask before booking, red flags in contracts. Photographer quotes from the beta anonymized into ranges.
- **Kalas weave-in:** One line: Ava searches photographers the same way she searches venues and puts their quotes side by side.

**7. "Lille bryllup i København: sådan holder I et intimt bryllup for under 20 personer"**
- **Target query:** "lille bryllup københavn" / "intimt bryllup"
- **Angle:** The underserved segment — restaurants with private rooms, rådhusbryllup + dinner formats, why small ≠ cheap per head, and sample budgets at 10/15/20 guests.
- **Kalas weave-in:** Note that Ava's brief can be "12 gæster, intimt, restaurant" just as easily as 120 — small weddings deserve legwork too.

**8. "Catering til bryllup: priser pr. kuvert og de spørgsmål, der afslører den rigtige leverandør"**
- **Target query:** "bryllupscatering pris" / "catering bryllup pris pr. kuvert"
- **Angle:** Demystify kuvertpris — what it includes and hides (service? vin? moms? oprydning?), with a comparison worksheet. Danish caterer pricing is famously opaque; be the article that isn't.
- **Kalas weave-in:** The worksheet exists as a live feature: Ava extracts exactly these line items from caterer replies automatically.

**9. "Bryllupshjemmeside: hvad skal den indeholde — og hvad kan I droppe?"**
- **Target query:** "bryllupshjemmeside"
- **Angle:** The essential content checklist (praktisk info, RSVP, ønskeliste-etikette in a Danish context, dresscode wording that doesn't offend), plus what nobody reads. Honest about DIY options.
- **Kalas weave-in:** Kalas includes a wedding site that updates itself when your plans change — mentioned as one option among the DIY routes.

**10. (EN) "Getting Married in Denmark: A Practical Guide for International Couples (2026)"**
- **Target query:** "getting married in denmark" / "wedding planner copenhagen english"
- **Angle:** Denmark is a European destination-wedding magnet due to simple marriage paperwork — huge international search volume. Cover the legal steps (Agency of Family Law), timeline, costs, and how to plan Danish vendors from abroad without speaking Danish.
- **Kalas weave-in:** Naturally strong fit: "Ava works in English but writes to Danish vendors in natural Danish" — the one article where the product can be a full section rather than an aside.

---

*End of pack. Suggested next steps: (1) team review of §1 copy recommendations → hand approved lines to design/eng as tickets; (2) legal check on the pricing comparison line and beta-price promise; (3) native-DA proofread pass on all Danish strings before anything ships.*
