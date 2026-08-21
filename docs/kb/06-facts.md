# 06 — Fact sheet

Check anything here before it ships. Legend: ✅ solid and citable · ⚠️ hypothesis,
international or industry-sourced · ❌ do not publish.

---

## Product facts (verified against the codebase, commit `6ceb2f9`)

| Fact | Value |
|---|---|
| Product / agent | Kalas / Ava |
| Outreach address | `ava@kalas-weddings.com` |
| Codebase | ~42,500 lines TS/TSX, 246 files, 67 commits since 2026-06-14 |
| API routes | 50 |
| Database | 31 Postgres tables, 22 migrations |
| Tests | 23 test files (pure logic: matching, ranking, RSVP, journey, i18n, sanitisation, …) |
| Agent tools | **29** — 11 action, 18 planning data |
| Screens | 12 navigation destinations |
| Seeded checklist | **205 items** + 19 timeline milestones, written for Danish weddings |
| Invitation templates | **20**, across five design families |
| Outreach languages | ~**30** mapped, English fallback for multilingual countries |
| English dictionary | ~1,680 entries; ~330 strings still unwrapped |
| Reply polling | Every 5 minutes, Render cron, Frankfurt |
| Venue search | 8–12 candidates per query, Places-verified |
| Website unlock | **499 kr** one-time |
| Invitation print | ~$2.50 / $2.20 / $2.00 per card at 25–200 (**USD cents**) |
| Suggested print quantity | 60% of guest count, rounded up to the nearest 25 |
| Ranking prior | Bayesian, prior 4.2, weight 10 |

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres,
Auth, Realtime, Storage) · Gemini 2.5 Flash (+ image model, + heavier HTML model) ·
Google Places API (New) · Gmail API · Jina Reader · Stripe · Netlify · Render.

---

## Danish market — ✅ citable

| Fact | Value | Source |
|---|---|---|
| Couples married, 2025 | **32,624** | Danmarks Statistik |
| Couples married, 2024 | 32,861 (highest in years) | DST |
| Trend | +13% since 2015; first marriages +20% in ten years | DST |
| Average budget | **112,000–149,000 kr** | Industry, 2026 |
| Per guest | 745–1,000 kr | Same |
| Civil ceremony | 64.1% (from 53.4% in 2007) | DST |
| Church ceremony | 28.7% (from 41% in 2007) | DST |
| Average age, first marriage | 33.7 (women) / 35.7 (men) | DST |
| Seasonality | August = **18.8%** of all weddings; **>70% Saturdays** | DST |
| Wedding planner cost | **8,000–30,000 kr** | Danish industry |
| Transaction TAM (DK) | ≈ **4.2 bn kr/year** | 32,624 × ~130,000 kr |
| Software TAM (DK) at 599 kr | ≈ **20 m kr/year** | Arithmetic — state it before someone else does |

---

## Planning effort — ⚠️ international hypotheses

| Fact | Value | Caveat |
|---|---|---|
| Total planning time | 528 hours ≈ 66 working days over 11 months | US, 2019, 2,000 respondents, self-reported, PR research |
| Hours per week | 12 | Same |
| Vendor research per week | 6 hours | The Knot |
| Share of planning done online | 90% | The Knot |
| Vendors per wedding | **13–14** | The Knot 2026 |
| Contacted more vendors than planned to stay in budget | 37% | The Knot 2026 |
| Most time-consuming task | **Finding the venue** | SWNS |

**No Danish planning-time figure exists.** That absence is the survey's reason to
exist and its strongest line.

## Stress — ⚠️ US/UK, mixed quality

Stressful: 96% · very/extremely: 40% · strained the relationship: 43% · more
stressful than buying a house or job-hunting: 71% · considered eloping instead: 47%.

## Vendor side — ⚠️ industry data, most valuable to confirm in Denmark

| Fact | Value |
|---|---|
| Generic enquiries per vendor per week, in season | 30–50 |
| Median venue response time | 11 hours (best quartile: under 8 minutes) |
| Vendors ghosting >40% of enquiries | **64%** |
| Enquiry → booking | 21–60% |
| Response rate, detailed vs. generic enquiries | **85%** vs. markedly lower |
| Hypothesised value of a qualified lead | **150–400 kr** — supplier survey Q8 asks vendors to price it |
| Vendor relationships per year, Denmark | ~**440,000** (32,624 × 13–14) |

## Competition — ✅ reported

- The Knot + WeddingWire (same owner) and Zola ≈ **73%** of AI-generated answers to
  wedding questions
- **Joy**: $106.5M raised
- Newer AI planners: Losava, Everly (Irish, pre-seed, Enterprise Ireland)
- **Denmark**: bryllup.dk (magazine, fairs, vendor catalogue) · bryllupsklar.dk
  (checklists, budget, guest list, forum ~1.3m posts). Both passive. No Danish AI
  planning agent in market.

## AI adoption — ⚠️ Zola, ~6,000 couples, international

23% of couples already use AI while planning (up from 18%); ~90% would consider it.
Note the gap between considering and paying — that gap is what Q32–Q39 measures.

---

## ❌ Do not publish

- **"74 couples, median 94 hours, 61% automatable, 41% saved, ~38 hours per
  couple."** This is a *worked example* in `docs/markedsundersoegelse.md` showing
  how to phrase the finding. It is not data. It will look exactly like data to
  anyone skimming. Do not use it until the survey has run.
- Any specific Danish planning-time number, until measured.
- Any Kalas response-rate or time-saved claim from production — nothing is
  instrumented yet (see roadmap 1.6).

---

## Open questions

**Answered by the survey**
1. How many hours does a Danish wedding actually take, per task? (Q8)
2. Where is the autonomy boundary — what will couples let an agent do? (Q31)
3. What will they pay, and how? (Q36–Q39)
4. How large is the "wanted a planner, refused on price" segment? (Q23)
5. How many comparable quotes does a Danish couple actually get? (Q15)
6. Do Danish vendors confirm the ghosting and incompleteness hypotheses, and what
   is a qualified lead worth to them? (Supplier Q5, Q6, Q8)

**Answered only by shipping**
7. What is Kalas's real response rate versus the 85% benchmark?
8. Do couples approve the drafted enquiry, or edit it heavily?
9. How many vendors would claim a profile from an emailed link?
10. Does the guest layer convert to signups at any meaningful rate?

**Strategic, unresolved**
11. One-time or subscription? (Lifecycle argues one-time; cash flow argues
    subscription)
12. How fast to Sweden — and who writes that market's checklist?
13. When does taking vendor money start to compromise ranking integrity, and what
    is the public commitment that prevents it?

---

## Source documents in this repo

| File | What it is |
|---|---|
| `docs/markedsundersoegelse.md` | The full Danish market study: desk research, survey design, value formula, reporting plan, timeline, sources |
| `docs/spoergeskema.md` | The questionnaire |
| `docs/google-forms-script.gs` | Script that builds the survey in Google Forms |
| `docs/DESIGN_SYSTEM.md` | Canonical palette and component consistency spec |
| `docs/i18n-audit.md` | Exactly which strings remain untranslated, and the recipe |
| `README.md` | Setup, deployment, and how the outreach loop works |
