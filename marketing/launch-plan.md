# Kalas — Beta → Public Launch Plan (Denmark)

**Owner:** Growth/GTM · **Status:** Draft v1 · **Date:** July 2026
**Product:** Conversational AI wedding planner ("Ava"). Users describe the wedding; Ava finds real venues/caterers/photographers/florists, users swipe a shortlist, Ava sends personalized inquiries **from the user's own Gmail**, chases vendors, extracts quotes side-by-side, tracks budget, and keeps the wedding website updated.
**Pricing:** Free / Complete DKK 499/mo / Premium DKK 899/mo · **Beta:** ~150 couples, invite-only.

---

## 1. Goals & guardrails

### The market math that constrains everything

Denmark has roughly **28–30k weddings/year**; the Capital Region accounts for roughly a third (~9–10k). At any moment there are perhaps **12–15k actively planning couples in greater Copenhagen** (12–18 month planning windows). This is a *small, high-intent, fully addressable* market — the opposite of a spray-and-pray SaaS. Every channel decision below follows from this: precision beats reach, and the couple's own network (guests, vendors, engaged friends) is the cheapest distribution we will ever have.

### LTV reality check (this sets the CAC ceiling)

A wedding subscription is inherently churny — the customer *graduates*. Expect **4–7 paid months** on Complete (DKK 499): blended LTV of roughly **DKK 2,000–3,000** per paying couple. With ~10% free→paid, a signup is worth ~DKK 200–300.

> **Guardrail #1: blended CAC ≤ DKK 150/signup, ≤ DKK 1,200/paying couple.** Any channel that can't get there after two experiment cycles gets cut.

### Launch goals (first 3 months post-public-launch, Copenhagen)

| Metric | Target | Why this number |
|---|---|---|
| Signups | **600** (≈50/week) | ~5% of actively-planning CPH couples over a quarter. Ambitious for a solo team but reachable with fairs + FB groups + search intent; 5,000 would be fantasy. |
| Gmail connect rate | **≥ 60%** of signups | The scariest step in onboarding (OAuth `gmail.send` scope). If this is low nothing downstream matters — it's the leakiest point in the funnel and the first thing to instrument. |
| **Activation = first inquiry sent** | **≥ 30%** of signups | Requires chat → search → swipe → approve draft → send. 30% is healthy for a multi-step activation; beta cohort should already tell us the baseline. |
| Free → paid conversion | **8–12%** of *activated* users within 30 days | Free tier caps at 5 outreach emails — a couple seriously comparing venues hits that wall in week one. That wall is the conversion event. |
| Paying couples / MRR | **~25 paying / DKK 12–15k MRR** | 600 × 30% activation × ~12% paid ≈ 22–25. Modest, honest, and enough to prove the funnel before spending on Phase 2. |

### Guardrails (things we will *not* do)

- **No fake urgency at launch.** The animated beta counter (`BetaUserCounter.tsx`, base 142) is fine for beta vibes; replace it with the *real* Supabase count at public launch. Denmark is a small, gossipy market — one Reddit/Trustpilot thread about a fake counter costs more than it ever earned.
- **No discounting below DKK 499.** Discount *duration* (first month free via referral), never price — anchors are impossible to rebuild in a market this small.
- **Vendor trust is load-bearing.** We send email from couples' own Gmail into a tight-knit vendor community. One spammy pattern and venue owners warn each other in *their* Facebook groups. Rate limits, honest sender identity, and easy human takeover are growth features, not compliance chores.
- **DA-first in public channels.** The product is bilingual EN/DA; marketing in Copenhagen should default to Danish (couples plan in Danish, vendors reply in Danish), with EN for the expat segment (a real niche in CPH — international couples marrying in Denmark are underserved and search in English).

---

## 2. Phased plan

### Phase 0 — Private beta (now → ~2 months)
- **Focus:** activation mechanics and vendor reply rate, not growth. Get 150 → 300 couples via waitlist drips only.
- **Do:** instrument the full funnel (see §6); interview 15 beta couples (especially ones who *didn't* send inquiries); measure vendor reply rate and time-to-first-quote per category; fix the Gmail-connect drop-off; collect 10 usable testimonials + 3 written case studies ("we got 9 venue quotes in 5 days") with named couples and photos.
- **Exit criteria:** ≥60% Gmail connect, ≥35% beta activation, vendor reply rate ≥50% within 7 days, ≥5 paying couples, refund/complaint rate ~0, quote-extraction accuracy spot-checked ≥90%.

### Phase 1 — Copenhagen public launch (months 1–4)
- **Focus:** own greater Copenhagen. One city = one vendor pool to build reply-rate reputation in, one fair circuit, one press market.
- **Do:** launch week (see §5); Danish landing page as default for DA browsers; Google Ads on CPH-intent queries; 2 wedding fairs; 10 photographer partnerships; seed 3–4 Facebook wedding groups honestly.
- **Exit criteria:** 600+ signups, ≥30% activation, ≥25 paying, CAC within guardrail on at least two channels, vendor reply rate holding ≥50% as volume grows (this is the canary — if it drops, vendors are tuning us out and we pause growth to fix vendor experience).

### Phase 2 — Denmark-wide (months 4–10)
- **Focus:** Aarhus/Odense/Aalborg + the big venue belt (Fyn manor houses, Sjælland estates). Mostly the same playbook; vendor DB coverage is the actual work.
- **Do:** national SEO content engine (venue/price guides per region); Aarhus fair; scale the winning paid channel from Phase 1; launch vendor self-serve profiles ("claim your listing").
- **Exit criteria:** 2,500 cumulative signups, 120+ paying (MRR ~DKK 60k+), ≥30% of new signups from organic/referral (proof the flywheel spins without ad spend), payback < 3 months on paid.

### Phase 3 — Nordics (months 10–18)
- **Focus:** Sweden first (product name is literally Swedish — "kalas" = celebration; ~40k weddings/yr, culturally adjacent, Stockholm mirrors CPH), then Norway. **Not before** Phase 2 exit criteria are met — vendor coverage doesn't transfer across borders and each country is a cold start on the vendor side.
- **Do:** SV localization, Stockholm vendor seeding via the same fair/partnership playbook, price in SEK at parity.
- **Exit criteria (go/no-go per country):** Stockholm reply rate ≥40% within 60 days of seeding; if vendors don't reply, retreat and deepen Denmark instead.

---

## 3. Channel plan (ranked by expected ROI for this niche)

Ranked for a solo/small team in Copenhagen. "Contribution" = share of Phase 1 signups.

### 1. Facebook wedding groups — **highest ROI, do first**
- **Effort:** Low (2–3 h/week, founder-personal). **Cost:** DKK 0.
- **Why #1:** Danish wedding planning *lives* in Facebook groups (e.g. "Bryllupsinspiration", "Bryllup 2026/2027" year-cohort groups, "Brides of Denmark" for expats — verify current names/admins). Tens of thousands of exactly-right members, zero cost, and recommendation threads ("hvor finder jeg festlokaler nær København?") are daily occurrences.
- **How without getting banned:** join as founders, answer venue/budget questions genuinely for 2 weeks before ever mentioning Kalas; ask admins for a sanctioned intro post or giveaway; recruit 5–10 beta couples per group as authentic voices who mention Kalas when relevant. Never astroturf — small country, people notice.
- **Expected contribution:** 20–30% of Phase 1 signups.
- **First experiment:** admin-approved post in one group offering 25 free Complete months for feedback; measure signups from a tracked link within 72 h. Success bar: 40 signups.

### 2. Google Ads on high-intent Danish queries — **most scalable paid**
- **Effort:** Medium (setup + weekly tuning). **Cost:** DKK 5–20k/mo; expect DKK 8–20 CPC on venue terms (low-competition Danish long-tail is cheap).
- **Why:** someone searching "bryllupslokaler københavn" at 22:00 is our user *tonight*. Kalas's pitch maps 1:1 onto the search: "Don't browse 40 venue pages — tell Ava and get real quotes."
- **~10 example keywords (DA):**
  1. `bryllupslokaler københavn`
  2. `bryllupssteder sjælland`
  3. `festlokaler bryllup pris`
  4. `bryllupsfotograf københavn pris`
  5. `catering til bryllup pris pr. person`
  6. `hvad koster et bryllup`
  7. `bryllupsplanlægger københavn` (intercepts DKK 30k+ human-planner intent with a DKK 499 answer)
  8. `bryllupsbudget skabelon`
  9. `lade i nordsjælland bryllup` (barn-wedding long-tail; replicate per style/region)
  10. `billige bryllupslokaler københavn`
  11. (EN, expat segment) `wedding venues copenhagen`, `getting married in denmark`
- **Expected contribution:** 20–25% of signups; the channel we scale with budget.
- **First experiment:** DKK 6k over 3 weeks, two ad groups (venue-search vs. planner-intent), dedicated DA landing pages. Kill bar: CPA > DKK 250/signup after landing-page iteration.

### 3. Photographer & venue partnerships — **slow burn, compounding**
- **Effort:** Medium-high (relationship work). **Cost:** ~DKK 0–5k (rev-share or mutual referral, not cash).
- **Why:** photographers are booked *earliest* (12–18 months out) and are the most digitally-native, community-connected vendor category. One photographer touches 25–40 couples/year. Venues want fewer tire-kickers — Kalas inquiries arrive pre-qualified (date, guest count, budget already structured).
- **Mechanic:** photographer gives couples "1 month of Kalas Complete free" as a client perk; Kalas lists the photographer prominently in relevant searches. For venues: "respond fast, get a 'responds within 24h' badge and better shortlist placement" (see §4).
- **Expected contribution:** 10–15% of Phase 1 signups, growing every quarter.
- **First experiment:** pitch 15 CPH photographers personally; goal 5 signed partners and ≥10 attributed couple signups in 6 weeks.

### 4. Wedding fairs (Copenhagen bridal fairs) — **highest quality per lead**
- **Effort:** High (booth, weekend, demo prep). **Cost:** DKK 8–25k/fair (stand + materials).
- **Why:** CPH-area bridal fairs (e.g. the annual bryllupsmesse events at Øksnehallen/Docken — confirm the season's calendar; most cluster Jan–Mar, peak engagement season) put hundreds of *just-engaged* couples in one room, plus **every important vendor exhibits there** — one weekend serves both sides of the marketplace.
- **The move:** don't hand out flyers — do live demos. "Tell Ava your wedding right now" on an iPad; couple leaves with a real venue shortlist in their account. Prize draw (free Premium for a year) for email capture. Walk the floor and pitch vendors between rushes.
- **Expected contribution:** 5–10% of signups but the *highest activation rate* of any channel, plus 20–30 vendor relationships per fair.
- **First experiment:** one fair, smallest bookable stand. Success bar: 100 signups, ≥50% of them activated within 2 weeks, 15 vendor conversations.

### 5. Instagram/TikTok — organic + light paid
- **Effort:** High for organic (consistent content). **Cost:** organic ~0 + time; paid DKK 5–15k/mo.
- **Why ranked mid:** the audience is there (wedding content over-indexes) but intent is diffuse and the algorithm doesn't respect national borders — expect wasted reach. Best used as *proof and retargeting*, not cold acquisition.
- **Content that fits us:** screen-recorded "Ava finds 12 barn venues near Roskilde in 90 seconds" clips; real quote-comparison reveals ("what 8 CPH venues actually quoted for 100 guests" — anonymized, this is irresistible content because Danish wedding prices are opaque); beta-couple takeovers. Paid: retarget site visitors + lookalikes on beta couples, DA creative, CPH-region geo only.
- **Expected contribution:** 10–15%, plus it powers every other channel with social proof.
- **First experiment:** 6 price-transparency reels over 3 weeks; success = 1 clip >20k DA views or measurable signup lift.

### 6. PR — Danish tech + lifestyle media
- **Effort:** Medium, bursty. **Cost:** ~0 (founder-pitched; no agency at this stage).
- **Two separate tracks:** (a) tech/startup press — TechSavvy.media, Bootstrapping.dk, ITWatch, Børsen tech — story: "Danish AI agent emails wedding vendors for you"; (b) lifestyle — ALT for damerne, femina, Costume, Eurowoman, wedding-blog features — story: real couple + "we saved 40 hours and DKK 20k". Track (b) converts; track (a) builds vendor/investor credibility and backlinks.
- **Expected contribution:** spiky 5–10%; one good lifestyle feature can beat a month of ads.
- **First experiment:** exclusive launch story to one tech outlet + one couple-story pitch to one lifestyle outlet in launch week.

### 7. SEO content — cheapest long-term channel, slowest payoff
- **Effort:** Medium, steady (1–2 DA articles/week). **Cost:** ~DKK 3–8k/mo freelance DA writer, or founder time.
- **Why last in rank but non-optional:** compounds into Phase 2/3 exactly when paid CAC starts climbing. Danish wedding SERPs are weak — winnable with modest effort.
- **What to write:** programmatic venue guides ("Bryllupslokaler i Nordsjælland: priser og kapacitet 2027") generated from our own vendor DB — content nobody else can cheaply replicate; price-transparency pieces from anonymized real quote data ("Hvad koster et bryllup i København i 2027? Rigtige tal fra rigtige tilbud" — our unique data asset); checklist/budget templates gated behind signup.
- **Expected contribution:** <5% in Phase 1 → 25%+ by Phase 2 exit.
- **First experiment:** publish 5 cornerstone pieces at launch; check indexing and first rankings at day 45.

---

## 4. Vendor-side flywheel

Every inquiry Ava sends **from a real couple's Gmail** is a vendor touchpoint we don't pay for. A venue receiving 5 Kalas inquiries a month experiences the product before we ever pitch them. Design that experience deliberately.

### 4.1 Make Kalas inquiries the *best* inquiries a vendor receives
Vendors' #1 complaint about portal leads (Bryllup.dk-style) is vague tire-kickers. Ava's inquiries should be famous for the opposite: date (or range), guest count, budget band, style, and specific questions — everything a venue needs to quote in one reply. **The structured brief *is* the marketing.** Within months, "a Kalas email" should mean "a serious couple, easy to quote."

### 4.2 The email footer — tasteful, honest, useful
The email is the couple's, from their address, in their voice. The footer is our only branding surface; keep it to two quiet lines below the couple's sign-off:

> *Denne forespørgsel er sendt med hjælp fra [Kalas](https://…/vendors?utm_source=inquiry_footer) — svar som normalt, [Name] modtager dit svar direkte.*
> *Svar med pris og ledighed i ét svar, så sammenligner parret hurtigere. · Er du leverandør? Se din gratis profil →*

Why each element earns its place: line 1 is **honest disclosure** (vendors will figure out the pattern anyway — a tool that discloses itself is trustworthy; one that gets caught is spam) and reassures that replying normally works. Line 2 gives the vendor a *selfish reason* to engage (faster reply → better standing) and one low-key link to the `/vendors` page (which already exists off the pricing section). No logos, no images, no "powered by" bombast. **Rule: the footer must never be longer than the couple's own sign-off.**

### 4.3 Reward fast replies with visibility (the actual flywheel)
1. Track reply time per vendor (we already parse replies for quote extraction).
2. Vendors replying within 24–48 h earn a **"Svarer hurtigt" badge** and rank higher in Ava's shortlists → more inquiries → more bookings.
3. The `/vendors` page shows each vendor their stats: inquiries received, reply time, how they compare. Claiming a profile is free.
4. Slow or non-responding vendors get one polite nudge from Ava (on the couple's behalf) — which itself demonstrates the product's value to the couple.

Loop: fast replies → better placement → more Kalas leads → vendors *want* Kalas couples → vendors mention Kalas to other couples and other vendors. Free, qualified leads are the one thing every wedding vendor wants; we're the only channel giving them away.

### 4.4 Escalation path to promotion
- **Months 1–3:** footer + badge only. Measure reply rates.
- **Months 3–6:** email the 25 most-inquired CPH venues their stats ("you received 14 Kalas inquiries this quarter; median reply 3.1 days; fast-repliers get 2× more") and invite them to claim profiles.
- **Months 6+:** "Kalas-recommended vendor" kit — a small site badge and a card in their inquiry-reply template. Vendors displaying it are advertising us to *every* couple who contacts them, including non-Kalas couples.
- **Explicitly not yet:** charging vendors. Monetizing vendor-side before liquidity kills reply rates — revisit at Phase 2 exit only if reply rate is stable ≥60%.

**Vendor guardrails:** cap inquiries per vendor per couple (1 + 1 nudge); dedupe so a vendor never gets two near-identical mails from the same couple; instant, honored opt-out list; monitor per-vendor sentiment — the flywheel spins on trust.

---

## 5. Launch-week checklist

### Product Hunt: **soft yes — but it is not the launch**
Reasoning: PH's audience is global tech workers, not Danish engaged couples — expect near-zero direct signups. But it costs one prepared morning and buys (a) a durable backlink + "featured on PH" credibility for the vendor page and investor conversations, (b) attention from Danish tech press who scan PH, feeding PR track (a), and (c) the expat/international-couple niche, which *does* overlap PH. Verdict: launch on PH on the **quietest** day of launch week (Thursday), spend ≤1 day preparing, do not chase the leaderboard, and never report PH numbers as launch success. The real launch is the fair, the FB groups, and Danish press.

### The checklist
**T-minus 2 weeks**
- [ ] Replace `BetaUserCounter` with real Supabase count (or drop it for "X quotes delivered to couples" — a more defensible stat).
- [ ] Danish landing page live and default for `da` locales; EN retained for expats.
- [ ] Press kit at `/press`: one-pager (DA+EN), founder photos/bio, product screenshots + 30-sec demo video, 2 couple case studies with quotes and photos, logo pack, real beta stats (couples served, inquiries sent, median time-to-first-quote).
- [ ] Referral mechanics live: **give a month, get a month** — referred couple gets first Complete month free, referrer gets a free month (or DKK 499 gift card if already graduated). Trigger the ask at *peak-delight moments*: right after the first quotes land, and after a booking is confirmed. Secondary loop: "Planned with Kalas" footer (opt-out) on every Kalas wedding website + RSVP email — each wedding site is seen by ~100 guests, and guests of marrying-age couples include the next cohort of engaged couples. This is our most structurally sound loop; instrument it from day one.
- [ ] Load test the cron/reply-polling path; a launch spike that delays quote extraction breaks the core promise.
- [ ] Google OAuth consent screen out of Testing mode / verified for `gmail.send` + `gmail.readonly` — **hard launch blocker**; unverified-app warnings will crater Gmail-connect rate.
- [ ] Support channel (shared inbox + FAQ) and a status page; solo team needs deflection.

**T-minus 1 week**
- [ ] Waitlist conversion sequence (3 emails): Day 0 "you're in" + activation CTA ("tell Ava about your wedding — 2 minutes"); Day 3 case study + nudge to connect Gmail; Day 7 "founding couple" offer — 3 months Complete for the price of 1, expires in 72 h. Target: ≥40% of waitlist signs in, ≥25% activates.
- [ ] Exclusive briefing to one Danish tech outlet (embargo = launch day); couple-story pitch to one lifestyle outlet.
- [ ] FB group admins pre-warned; launch-day posts sanctioned.
- [ ] 10 beta couples committed to same-day authentic posts/stories.

**Launch week**
- [ ] Mon: waitlist email 1 + press embargo lifts. Tue: FB group posts + beta-couple stories. Wed: founder LinkedIn post (DK startup LinkedIn is disproportionately effective) + Instagram reel. Thu: Product Hunt. Fri: metrics review vs. §6 dashboard; ship fixes for the worst funnel leak found.

---

## 6. Metrics dashboard spec — the 10 weekly numbers

Reviewed every Monday. Source: Supabase + ad platforms. Split by locale (DA/EN) where relevant.

| # | Metric | Definition | Healthy (Phase 1) |
|---|---|---|---|
| 1 | **New signups** | New accounts (completed Google sign-in) this week, by channel (UTM/first-touch) | ≥50/wk |
| 2 | **Gmail connect rate** | % of this week's signups that completed Gmail OAuth within 72 h | ≥60% |
| 3 | **Activation rate** | % of signups ≤14 days old that sent their first vendor inquiry (the north-star activation event) | ≥30% |
| 4 | **Time-to-activation** | Median hours signup → first inquiry sent | <48 h |
| 5 | **Inquiries sent** | Total vendor inquiry emails sent this week (volume of core value delivery; also the spam-risk canary) | growing, no vendor complaints |
| 6 | **Vendor reply rate** | % of inquiries (sent 7–14 days ago) with ≥1 reply — lagged one week to be measurable | ≥50% |
| 7 | **Time-to-first-quote** | Median days from a couple's send-batch to first *extracted* quote (what the couple actually experiences) | ≤3 days |
| 8 | **Free→paid conversion** | % of couples who activated 30 days ago that are now on a paid tier | 8–12% |
| 9 | **MRR / paying couples** | Active paid subscriptions × tier price; note graduations (wedding done) separately from churn (quit unhappy) — same revenue effect, opposite meaning | per §1 trajectory |
| 10 | **Referral share (K-proxy)** | % of new signups attributing to referral links, wedding-website footers, or "friend" in the signup survey | ≥15% by month 3 |

One ratio watched monthly, not weekly: **blended CAC** (total marketing spend ÷ signups) vs. guardrail #1, per channel.

---

## 7. Budget scenarios

### DKK 25k/month — precision mode (likely reality)
Founder time is the main channel; money goes only where organic can't reach.

| Line | DKK/mo | Notes |
|---|---|---|
| Google Ads | 10k | Keywords from §3.2 only, CPH geo, DA landing pages. The one always-on paid channel. |
| Wedding fairs (amortized) | 6k | One well-executed fair per season (~DKK 18k/quarter incl. stand + materials). |
| Content/SEO freelance (DA) | 4k | 3–4 articles/mo from the §3.7 playbook; founder edits. |
| Micro-influencer gifting | 3k | Free Premium + small fee to 2–3 Danish wedding-content creators/mo. Whitelisting the best clip as a paid ad comes out of the Google/Meta line. |
| Tools & referral rewards | 2k | Analytics, email, referral free-months (COGS-ish but budget it). |

**Not funded:** Meta paid at scale, PR agency, TikTok paid. FB groups, partnerships, PR, and founder-led social cost time, not money — they still run at full intensity. Expected outcome: hit Phase 1 goals ~1 month late; CAC well under guardrail.

### DKK 100k/month — acceleration mode (funded)
Rule: extra money buys **speed on proven channels and content production capacity** — never new unproven channels at 4× the spend.

| Line | DKK/mo | Notes |
|---|---|---|
| Google Ads | 25k | Expand to full DA keyword universe + EN expat terms + Sjælland/Fyn geo. Watch CPA weekly; venue-term inventory in DK is finite — expect diminishing returns past ~30k. |
| Meta/TikTok paid | 25k | Retargeting + lookalikes on *activated* couples (not raw signups); 6–8 new DA creatives/mo. |
| Fairs & events | 15k | Every relevant DK fair with a proper stand; host our own quarterly "Sådan planlægger du brylluppet på en weekend" evening event for 40 couples. |
| Content & UGC engine | 15k | Part-time DA content person: 2 SEO pieces + 3 short-form videos/wk; the price-transparency data series as the flagship. |
| Partnership & vendor program | 10k | Part-time vendor-relations freelancer running §4.4 outreach; photographer co-marketing budget. |
| PR & brand | 5k | Freelance DA PR consultant on retainer for the lifestyle-media track; press-trip/demo events for journalists. |
| Reserve / experiments | 5k | One new experiment per month max (podcast ads on Danish relationship/lifestyle pods is first in queue). |

Expected outcome: Phase 1 targets in ~2 months instead of 4, Phase 2 pulled forward a quarter — **but only if** vendor reply rate holds ≥50% at the higher inquiry volume. If it slips, spend down-shifts to 25k-mode and the surplus goes to vendor-side work; growth spend against a degrading vendor experience is lighting money on fire.

---

*Review cadence: this plan is re-cut at each phase exit; channel ranks are re-scored monthly against actual CAC and activation quality, not vibes.*
