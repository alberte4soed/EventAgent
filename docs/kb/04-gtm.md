# 04 — Go to market

## 1. The shape of the problem

Weddings are the worst possible SaaS retention profile and one of the best possible
referral profiles. A couple uses Kalas intensely for 9–18 months and then never
again. There is no expansion revenue and no second purchase.

That has three consequences that should drive every GTM decision:

1. **Acquisition cost has to be recovered inside one wedding.** No LTV story
   rescues an expensive channel.
2. **Referral and the guest layer are worth more than they look**, because they are
   the only compounding assets on the consumer side.
3. **The durable business is the supply side.** Vendors are annual, renewing,
   contactable, and already receiving Kalas email. The consumer product is how you
   earn the right to sell to them.

## 2. Timing

Two clocks matter.

**The wedding calendar.** August is 18.8% of Danish weddings; over 70% fall on a
Saturday. Planning runs 9–18 months, so couples enter the market roughly a year
ahead. **Engagement season — Christmas Eve through Valentine's Day — is the peak
acquisition window**, and everything shipped in autumn should be aimed at it.

**The AI window.** 23% of couples already use AI while planning, up from 18% the
year before; ~90% say they would consider it. That is permission, not demand — and
the gap between "would consider AI" and "would pay for an agent" is exactly what
the survey is built to measure (Q32–Q39). Right now there is no Danish-language AI
planning agent in market. That window does not stay open indefinitely.

## 3. Consumer channels, ranked by cost per acquired couple

**1. The guest layer — free, compounding, currently switched off.**
Every published wedding site, invitation, RSVP page, registry claim page and guest
photo upload puts Kalas in front of 60–150 people. Some are engaged; more will be
within two years. **There is no capture on any of these surfaces today.** A tasteful
"planned with Kalas" mark plus a waitlist link on `/w/[slug]`, `/i/[slug]` and the
guest album is the cheapest growth lever in the codebase and probably a day of
work. Ship it first.

**2. The vendor channel — free, already running, unharvested.**
Every venue search sends 8–12 enquiries. At even modest usage, hundreds of Danish
wedding vendors will receive email from `ava@kalas-weddings.com` — well-written,
complete, in Danish, from a couple with a real budget. That is an outbound
supply-side campaign that is already happening as a side effect of the product
working. Right now it terminates in a vendor's inbox and goes nowhere. See §4.

**3. Facebook wedding groups.** Several Danish groups with 10,000–40,000 members.
High intent, high density, and the natural home of the survey. Known bias: people
in wedding groups plan more than average — state it openly in any methodology
section rather than letting a reviewer find it.

**4. Vendors sharing the link with their own couples.** A venue that gets better
enquiries through Kalas has a direct reason to point couples at it. This is
referral and supply-side acquisition in the same motion, and it only becomes
available once §4 exists.

**5. Instagram — wedding hashtags and micro-influencers.** Visual product, visual
market. The AI-designed wedding sites and the 20 invitation templates are the
shareable artefacts.

**6. Bryllupsmesser (wedding fairs).** `bryllup.dk` runs them. Concentrated
in-person intent, and the fastest way to talk to both couples and vendors in one
afternoon.

**7. The bryllupsklar.dk forum** — ~1.3 million posts of couples describing their
problems in their own words. Best used as research and as a source of the exact
language couples use, before it is used as a channel.

**8. Paid search.** Last, not first. Wedding keywords are contested by directories
with advertising business models and deeper pockets. Do not open here.

## 4. The vendor wedge — the most important unexecuted idea

**The situation.** Danish vendors receive 30–50 enquiries a week in season. The
hypothesis is that 64% fail to answer more than 40% of them, that median response
time is around 11 hours, and that detailed enquiries get roughly 85% response rates
where generic ones get markedly less. Vendors ghost incomplete enquiries because
they cannot quote without a date, a guest count and a budget.

**The asymmetry.** Kalas is *structurally incapable* of sending an incomplete
enquiry. Those fields exist in the event record before the agent will search.
Kalas's outbound is by construction the kind vendors answer.

**The move.** Every enquiry Ava sends is an unclaimed vendor relationship. Add a
one-line footer — *"See the full brief and reply in one click"* — pointing at a
lightweight vendor view. No account required to start. That gives:

- a faster, better reply for the couple (the core loop gets better)
- a structured brief for the vendor instead of an email to parse
- **a claimed vendor profile**, which is the start of a supply-side business
- reply-rate telemetry, which is a data asset nobody else in Denmark has

**Then price it.** Supplier survey Q8 asks vendors directly what a fully-informed
enquiry is worth; the working hypothesis is 150–400 kr. With ~440,000 vendor
relationships a year in Denmark, this is an order of magnitude above the consumer
software TAM, and the survey has vendors pricing it themselves — which is the
strongest form the number can take in an application.

**Sequence it correctly, though.** The vendor side is worthless without couple
volume, and couple volume is what makes vendors claim. Consumer first, vendor
claim flow second, vendor monetisation third. Do not invert this.

## 5. Pricing

**What exists today**, and it needs saying plainly: the two things Kalas charges
for are the two features with the *least* differentiation.

| SKU | Price | Note |
|---|---|---|
| AI-designed wedding website | **499 kr one-time** | Runs free when Stripe is unconfigured |
| Invitation printing | ~$2.50 / $2.20 / $2.00 per card by volume (25–200) | Priced in **USD cents**, unlike everything else |

**The core loop — the thing that saves the ~38 hours — is free.** That is
backwards. Website builders are commodity; agentic vendor outreach is not.

**Recommended structure** (to be confirmed against Q36's Van Westendorp curves and
the concrete 499 kr test in Q38):

- **Free** — chat, onboarding, budget, guest list, timeline and checklist. Enough
  to be genuinely useful, and enough to reach the guest layer.
- **One-time unlock, ~499–999 kr** — the outreach loop: sending, reply
  attribution, quote extraction, proposed replies. Anchor it against the
  8,000–30,000 kr planner, never against other apps. One-time fits the lifecycle
  better than a subscription and removes the cancellation moment entirely.
- **Add-ons** — website, invitation printing, keeping the current SKUs.
- **Vendor side, later** — qualified lead fees or a subscription for claimed
  profiles. This is where the margin eventually lives.

**Open pricing questions the survey answers:** the acceptable band (Q36), whether
499 kr converts (Q38 — report only "definitely yes"; nothing else predicts
behaviour), which payment model couples prefer (Q37, including the "free for us,
vendors pay" option), and what couples themselves value 40 saved hours at (Q39).

## 6. The research plan

`docs/markedsundersoegelse.md` is a complete, well-designed study, and
`docs/google-forms-script.gs` will build it. Targets: **≥150 couples** across two
branches — ≥70 married within 24 months (for actual time spent) and ≥70 currently
planning (for frustration and willingness to pay) — plus **20–30 vendors**.

The design choice worth understanding: The Knot asks couples *after* the wedding,
Zola asks *before*. Kalas does both, in one instrument that branches at question
one. Post-hoc respondents give reliable totals; pre-wedding respondents give
purchase intent. Asking one group for the other's answer is how these studies go
wrong.

**Methodological rules that matter more than the sample size:**
- Never ask "would AI help be nice?" — everyone says yes. Ask about the past (what
  did you do) and about money (what did you pay, what would you pay).
- Report **medians**, not means, for hours and kroner. One couple who spent 400
  hours ruins an average.
- Bottom-up beats top-down. The sum of Q8's per-task hours is the real estimate;
  Q7's single number exists only to show the gap — people typically undercount by
  30–50%, and **that gap is itself a finding**.
- One respondent per couple, or the hours double-count.
- Pilot with five people before sending.

**The best single figure in the study** is Q8 crossed with Q9: hours on one axis,
irritation on the other. The top-right quadrant is the product's reason to exist,
drawn from customer data. Build the deck around that chart.

**Q31 is the most interesting question in the instrument** — where couples draw the
autonomy line. Propose vendors? Write enquiries in our name? Read replies and
extract prices? *Answer* a quote without asking? Book and pay? The current product
already stops at approval on every write action, so a finding like "couples want
the agent to write but not to answer" is simultaneously validation, a product
principle and a documented insight no competitor has published in Danish.

**Timeline:** build and pilot (week 1) → distribute, vendor survey in parallel
(week 2) → second push via fairs, vendors and the forum (week 3) → close at n≥150
and run 8–12 phone interviews (week 4) → analysis, figures, one page per criterion
(week 5).

Two outputs are worth more than the rest combined: **Q40's waitlist conversion**,
because respondent-to-signup is the most direct demand measurement available, and
**one good quote from a real couple**, which beats three charts in front of any
panel.

## 7. Innofounder

The research document is explicitly engineered against Innofounder's criteria
(guidelines effective 01.01.2026). Map each to its evidence and deliver **one page
per criterion, one number, one figure** — not raw data.

| Criterion | The number | From |
|---|---|---|
| Market potential | 32,624 couples/year × willingness to pay; share scoring 8–10; waitlist signups | DST, Q31, Q33–35, Q40 |
| Competition | What couples use now and what it lacks — documenting that existing tools are passive | Q18–Q21 |
| Value creation | Hours saved (with the formula), kroner saved, stress reduction | Q8 + the automation table, Q24, Q26–28 |
| Innovation | Which tasks couples will actually delegate — the autonomy boundary | Q9, Q31, Q32 |
| Timing | AI attitudes and usage among Danish couples | Q29–Q30 |
