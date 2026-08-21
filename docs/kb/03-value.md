# 03 — Value

Kalas creates value on three axes. Most pitches measure only the first, which is a
mistake — the money and the trust axes are where the argument gets interesting.

| Axis | The claim | Evidence route |
|---|---|---|
| **Time** | Removes ~40% of planning hours | Survey Q6–Q8 + the automation table below |
| **Money** | More comparable quotes → better price. And a planner alternative at a fraction of 8,000–30,000 kr | Survey Q10–Q15, Q22–Q25 |
| **Trust** | Fewer moving parts, nothing falls between two stools | Survey Q26–Q28 |

---

## 1. The time argument, done properly

**This is where most applications collapse**: a number pulled from the air. The
formula is explicit and the automation rates are stated as estimates, not findings.

```
Time saved % = Σ (hours_task × automation_rate_task) / Σ (hours_task)
```

`hours_task` comes from respondents (Q8). `automation_rate_task` is **our own
judgement**, published as a table with a justification per row, and set
deliberately low — 70% where we believe 90%.

| Task | What Kalas does | Automation |
|---|---|---|
| Find and research venues | Agent searches the web, returns structured, Places-verified cards | 80% |
| Contact vendors / request quotes | One approval → personalised mail to all, in their language | 90% |
| Chase, collect and compare quotes | Replies pulled from the mailbox, price extracted automatically | 85% |
| Website / invitations / registry | Generated | 70% |
| Timeline and what's urgent now | Laid out backwards from the date | 60% |
| Guest accommodation + honeymoon | Search and suggestions | 60% |
| Budget and payment tracking | Auto-allocation across categories, reminders | 50% |
| Guest list and RSVP chasing | Import, tracking, reminders | 45% |
| Seating plan | Proposal, manual refinement | 40% |
| Attire, fittings, rings, beauty | — | 0% |
| Ceremony, speeches, rituals, paperwork | — | 0% |
| Family coordination and expectation-setting | — | 0% |

Three rows at zero is not a weakness in the argument; it is what makes the
denominator honest and the number believable. A panel that sees 0% next to "family
coordination" trusts the 90% next to "contact vendors" more, not less.

**Band midpoints** for converting survey answers to hours: 0 → 0 · under 2 → 1 ·
2–5 → 3.5 · 6–15 → 10 · 16–40 → 27.5 · over 40 → 55.

### ⚠️ The worked example is not data

`docs/markedsundersoegelse.md` contains a sample result paragraph — *"Among 74
Danish couples married within the last two years, the median was 94 hours…
a 41% saving, about 38 hours per couple"*. **Those numbers are a template showing
how to phrase the finding once the survey has run.** They are not measurements.
Do not put them in a deck, an application or a landing page until the survey has
actually produced them. This is the single highest-risk misuse of this KB.

---

## 2. The money argument (under-used)

Two separate claims, and the second is stronger than it first looks.

**Better prices through comparison.** The industry hypothesis is that couples end
up with very few genuinely comparable offers on their largest line item. Survey
Q15 measures this directly. If the median Danish couple compares **three** quotes
on their venue, and Kalas makes ten as cheap as three, there is a kroner saving
sitting on top of the hours saving — on a line item that is a five-figure sum.
That is why Q10 and Q15 matter as much as Q8.

**The planner substitution.** A Danish wedding planner costs **8,000–30,000 kr**.
Kalas does a meaningful slice of that job. This is the cleanest willingness-to-pay
anchor available, and it reframes the price question entirely: not "is 499 kr a lot
for an app" but "is 499 kr a lot compared to 12,000 kr". Survey Q23 sizes the
segment that wanted a planner and refused on price.

**Vendor-side value, unmeasured.** A qualified, complete enquiry from a couple who
is actually searching has a price. The hypothesis is **150–400 kr per lead** and
supplier survey Q8 asks vendors to name it. If that holds, it is a larger business
than the consumer subscription — see `04-gtm.md` §4.

---

## 3. The trust argument

96% find planning stressful; 40% "very" or "extremely"; 43% say it strained the
relationship; 71% call it more stressful than buying a house or job-hunting; 47%
considered giving up and going to the town hall. **All US/UK, all of varying
quality — hypotheses, not facts.** Survey Q26–Q28 re-measure them on Danish ground.

This axis is worth measuring even if the Danish numbers come back identical to the
international ones. If Denmark matches, the market is validated on home data. If it
differs, that is a finding. Both outcomes are publishable; there is no losing
result.

---

## 4. Market size — the honest version

| | |
|---|---|
| Couples married in Denmark, 2025 | **32,624** |
| 2024 | 32,861 — the highest in years |
| Trend | +13% since 2015; first marriages +20% over ten years |
| Average budget | **112,000–149,000 kr** (745–1,000 kr per guest) |
| **Transaction TAM, Denmark** | 32,624 × ~130,000 kr ≈ **4.2 bn kr/year** |
| **Software TAM, Denmark, at 599 kr** | ≈ **20 m kr/year** |

**Do not lead with 4.2 bn kr.** A panel will discount it in one beat as a
transaction volume you do not touch. And do not hide the 20 m kr figure — someone
will do that division themselves, and it is better to have got there first.

The correct framing, which the research doc states plainly: **20 m kr is too small
to be a company, so the market case has to rest on one of two expansions, and
ideally both.**

1. **Geography.** The Nordics and Northern Europe — Sweden, Norway, Finland,
   Germany, the UK. The language layer already handles ~30 languages and the i18n
   system is N-language ready, so this is closer to a distribution problem than an
   engineering one.
2. **The supply side.** 32,624 weddings × 13–14 vendors each ≈ **~440,000 vendor
   relationships a year in Denmark alone**. At the hypothesised 150–400 kr per
   qualified lead, that is a market an order of magnitude above the consumer one —
   and Kalas already manufactures the exact artefact being priced.

Seasonality is real and worth planning around: **August accounts for 18.8% of all
Danish weddings and over 70% happen on a Saturday.** Planning starts 9–18 months
ahead, so the acquisition season is roughly autumn through spring for the following
summer. Engagement season — Christmas through Valentine's — is the peak moment to
be in market.

---

## 5. Evidence status — read this before quoting anything

| Claim | Status |
|---|---|
| 32,624 weddings; budgets; seasonality; civil/church split; ages | ✅ **Danmarks Statistik and Danish industry sources.** Quote freely |
| Planner cost 8,000–30,000 kr | ✅ Danish sources |
| 528 hours; 12 h/week; 6 h/week on vendor research | ⚠️ **US, 2019, self-reported, PR research.** Hypothesis only |
| 90% of planning online; 13–14 vendors; 37% over-contacted to stay in budget | ⚠️ The Knot, international. Directional |
| Stress figures (96 / 40 / 43 / 71 / 47) | ⚠️ US/UK, mixed quality. Hypotheses |
| Vendor ghosting 64%; 85% vs. generic response rates; 30–50 enquiries/week; 11h median response | ⚠️ International industry data. **The most valuable thing to confirm on Danish ground** |
| 23% of couples use AI, 90% considering | ⚠️ Zola, ~6,000 couples, international |
| 73% of AI wedding answers to two platforms; Joy's $106.5M | ✅ Reported, citable |
| **The 94-hour / 41% / 38-hour example** | ❌ **Illustrative template. Not measured. Do not publish** |
| Any Danish planning-time figure | ❌ **Does not exist yet.** This is precisely why the survey has value |

**The line that should open the research section of any application:**

> *There are no Danish figures for how long wedding planning takes. We collected
> them.*

That sentence beats any borrowed American statistic, and it is true the moment the
survey closes.
