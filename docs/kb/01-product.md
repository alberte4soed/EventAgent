# 01 — Product: what Kalas actually is

Deep dive on functionality as built, at commit `6ceb2f9` (2026-08-21).
Scale: ~42,500 lines of TypeScript/TSX across 246 files, 50 API routes,
31 Postgres tables, 22 migrations, 23 test files, 67 commits since 2026-06-14.

---

## 1. Identity

| | |
|---|---|
| Repo | `alberte4soed/EventAgent` |
| Product | **Kalas** — Swedish for a celebration |
| Agent persona | **Ava** |
| Outreach identity | `ava@kalas-weddings.com` (shared platform mailbox) |
| Source language | **Danish** (English is a translation dictionary, not the other way round) |
| Primary market | Denmark, with the Nordics structurally in reach |

One inconsistency worth knowing before you write copy: the `README.md` still
describes a generic "conversational event planner" for any event type, and the
agent tool schemas retain generic `event_type` fields. **The product as built is
wedding-specific** — the prompts, the journey model, the checklist, the vendor
taxonomy, the post-wedding phase. Treat "event agent" as legacy vocabulary; the
positioning is weddings.

---

## 2. Architecture

```
Next.js 16 (App Router, React 19, TS, Tailwind v4)
        │
        ├── Supabase — Postgres + Auth (Google) + Realtime + Storage
        │
        ├── Gemini 2.5 Flash
        │     ├── chat agent (29 function-calling tools)
        │     ├── Google Search grounding → venue/vendor discovery
        │     ├── structured extraction → venue cards, quotes, research
        │     ├── gemini-2.5-flash-image → invitation designs, site hero art
        │     └── separate heavier model → wedding-site HTML
        │
        ├── Google Places API (New) — the verification layer
        ├── Gmail API — one shared Workspace mailbox (internal OAuth app)
        ├── Jina Reader — gift-registry product metadata from pasted URLs
        └── Stripe — invitation print orders + website unlock
```

**Hosting.** Netlify runs the app. Netlify has no cron, so reply polling is a
separate **Render cron job** in Frankfurt (EU, next to Supabase) running
`worker/poll.ts` every five minutes. The worker is authoritative; the
`/api/cron/poll-replies` route exists only for manual triggering and is subject
to Netlify's function timeout.

**Two Google Cloud projects, deliberately.** The sign-in project's consent screen
must stay **External** so any `@gmail.com` user can log in. The mailbox project
must be **Internal**, owned by the Workspace org that hosts `ava@kalas-weddings.com` —
internal apps skip Google verification review and their refresh tokens are exempt
from the seven-day testing-mode expiry. Mixing these two is the single most
common way to break the outreach loop.

**Security posture.** Row-level security on the user-owned tables; a service-role
admin client is used only where there is no user session (Stripe webhooks, the
poll worker, public guest surfaces). Gmail refresh tokens are encrypted at rest
with `TOKEN_ENCRYPTION_KEY`. Guest-facing wedding sites can be password-gated
with a path-scoped cookie. Generated site HTML passes through `sanitize-html`
before it is stored or served.

---

## 3. The core loop — vendor outreach

This is the product. Everything else is a planning suite that many companies
have; this loop is the one that no competitor runs.

**1. Discovery.** `search_venues` sends a category-specific brief to Gemini with
Google Search grounding — "find 8 to 12 REAL wedding venues in or near
Copenhagen for a wedding with about 80 guests", plus the couple's vibes and
budget, with an explicit instruction to research each candidate's own site rather
than copy a listicle. A second structured-extraction pass turns the grounded prose
into typed cards, with a hard rule against fabricating emails, phone numbers or
URLs.

**2. Verification.** Every candidate is looked up in Google Places (New) for
canonical contact info, rating, review count, photos, and deduplication by place
id. This is what separates Kalas from "ChatGPT gave us a list" — the model
proposes, Places confirms.

**3. Ranking.** Pure, unit-tested (`src/lib/ranking.ts`). A Bayesian-smoothed
rating so a 5.0 with three reviews cannot outrank a 4.8 with four hundred
(prior 4.2, weight 10), plus a small bonus when the stated capacity covers the
guest count and when the couple's vibe words appear in the description.

**4. Swipe.** Tinder-style deck: right shortlists, left passes. Ava can also
swipe on the couple's behalf when they decide in conversation (`swipe_vendor`).

**5. One approval.** Ava writes a *single* master enquiry with a `{{venue_name}}`
placeholder and shows it in chat. She is explicitly forbidden from ever claiming
an email has been sent — sending happens only when the human approves.

**6. Send.** Each shortlisted vendor receives a personalised copy from the shared
platform mailbox, with `Reply-To: ava+<event-tag>@kalas-weddings.com`. Missing
contact addresses are looked up on the fly (`find_venue_email`). **The email is
written in the vendor's own language**, decided by a pure resolver
(`src/lib/venue/language.ts`) that reads the address first, then the website,
then the couple's language, then falls back to English — with ~30 languages
mapped and a deliberate English fallback for multilingual countries (Belgium,
Switzerland, Luxembourg) where guessing wrong is worse than not guessing.

**7. Attribution.** The Render worker polls every five minutes and attributes each
inbound message in three descending tiers: Gmail thread id → the plus-address tag
→ a sender address uniquely known to one event (free-mail domains excluded from
that last rule). Anything still unattributable is labelled `kalas/unmatched` for
human triage rather than guessed at. The tag matcher is regex-anchored so
lookalike locals and domain suffixes cannot match.

**8. Quote extraction.** Gemini pulls price and availability out of the reply body,
stores a structured quote plus a status, and pulls attachments into Storage.
Extraction is best-effort: the reply is stored even when extraction fails.

**9. Proposed reply.** Ava drafts the couple's response and queues it. The couple
approves; it sends into the same Gmail thread with correct `In-Reply-To` and
`References` headers so the vendor sees one continuous conversation.

**10. Live.** Supabase Realtime pushes every change to the dashboard.

### Why the one-mailbox design is both the moat and the risk

Every user's outreach flows through a single Gmail account, tagged per event via
plus-addressing. That is what makes the loop possible without asking every couple
to connect their own inbox — a conversion killer — and it is what lets Ava own the
thread end to end.

It is also a concentration risk: shared sender reputation, Gmail rate limits, one
Workspace account, and one spam-report cascade away from the core loop going dark
for everybody. See `05-roadmap.md`, horizon 1.

---

## 4. The agent

**29 function-calling tools**, split across two files.

*Action tools (11, `src/lib/gemini/tools.ts`)*
`show_page` · `update_event_details` · `search_venues` · `mark_venue_chosen` ·
`mark_vendor_booked` · `mark_stage_complete` · `find_venue_email` ·
`propose_email_draft` · `propose_vendor_reply` · `draft_invite_text` ·
`update_website_design`

*Planning data tools (18, `src/lib/gemini/planningTools.ts`)*
`get_planning_overview` · budget: `list_budget` / `set_budget_entry` /
`delete_budget_entry` · guests: `list_guests` / `add_guests` / `update_guest` /
`remove_guest` · tasks: `list_tasks` / `add_tasks` / `update_task` /
`delete_task` · registry: `list_registry` / `add_registry_items` /
`update_registry_item` / `delete_registry_item` · vendors: `list_vendors` /
`swipe_vendor`

### Three design decisions worth quoting

**Ava drives the screen.** `show_page` lets her navigate the app mid-sentence. The
system prompt is blunt about it: *"SHOW, don't describe"* — after a venue search,
open the vendor board; after a budget change, open budget. At most one navigation
per reply, for the page that matters most.

**She is forbidden from guessing about the couple's own data.** `get_planning_overview`
must be called before answering any question about status, money, counts or
what's missing. Never from memory.

**The journey is venue-first and enforced.** Stages are *derived*, not stored:
basics → venue → vendors → invites, computed from facts (location, guest count,
chosen venue, date) with manual overrides for couples who booked outside the app.
Non-venue vendor categories stay locked until the venue is settled, because
florists, photographers, musicians and caterers are all local to it. This is a
genuine product opinion, not a technical limitation — and it is defensible: the
venue is both the largest line item and the constraint that fixes everything else.

### Modes

- **Chat mode** — full-screen conversation, no sidebar; Ava's navigation decides
  what appears on the stage beside the chat.
- **Classic mode** — conventional sidebar navigation with Ava available.
- **Onboarding** — a conversational walkthrough where Ava narrates each page,
  pulls it up, and offers suggested prompts that *actually execute*. Asking for a
  venue search during the tour really lands venues on the board. It replaced an
  earlier spotlight/coach-mark tour.

---

## 5. The screens

Twelve navigation destinations.

| Screen | What it does | Notable |
|---|---|---|
| **Home** | Dashboard, journey stages, what's next | The canonical design reference for the whole app |
| **Tidslinje & tjekliste** | Milestones laid backwards from the date, plus a granular checklist | 19 milestones + **205 seeded checklist items**, written for Danish specifics — prøvelsesattest, salmer, sanghæfte, toastmaster, brudevals før midnat, æresport |
| **Inbox** | Vendor replies, extracted quotes, Ava's proposed responses | The output end of the core loop |
| **Venue & leverandører** | Explore / shortlist / booked, per category | Deep venue research: capacity, package tiers, pricing hints, practical constraints, auto-run for shortlisted venues |
| **Budget** | Category allocation, contracts, payment tracking | Ava reads and writes it; contract review is AI-assisted |
| **Gæster** | Guest list, RSVP, plus-ones, dietary needs, CSV import | Bulk `add_guests` for conversational entry |
| **Hjemmeside** | AI-designed public wedding site | Gemini generates a full token-driven design *and* HTML from the couple's photos and facts; **499 DKK one-time unlock** |
| **Ønskeliste** | Gift registry with guest claiming | Jina Reader scrapes title/image/price/store from a pasted product URL; guests see "taken", the couple sees who |
| **Invitationer** | Digital invitation builder | **20 templates** across five design families, live editor, AI-generated copy, share + RSVP, optional print order |
| **Bordplan** | Seating plan with drag and drop | |
| **Bryllupsrejse** | Honeymoon discovery on a 3D globe | Gemini curates per country, Places adds photos and ratings, cached per country+language — one Gemini call per country, ever |
| **Nygift** | The phase after the day | Thank-you list, guest photo album, vendor reviews, sharing. Deliberately always visible, because the date is nullable |

### The guest layer

Public, unauthenticated surfaces that put the product in front of everyone the
couple invites:

- `/w/[slug]` — the published wedding site, optionally password-gated
- `/w/[slug]/rsvp` — guest RSVP
- `/w/[slug]/registry/claim` — gift reservation
- `/w/[slug]/del` — guests upload their own photos after the day
- `/w/[slug]/tak` — thank-you surface
- `/i/[slug]` — the digital invitation with its own RSVP

Every wedding exposes Kalas to 60–150 people, a meaningful fraction of whom are
themselves engaged. **There is currently no capture on any of these pages.** See
`04-gtm.md`.

---

## 6. What is real, what is half-built

Being honest about this matters more than the feature list — anyone doing
diligence will find it in an afternoon.

**Solid.** The outreach loop end to end. Reply attribution (unit-tested, with an
explicit unmatched-triage path rather than a guess). Ranking. Journey computation.
The RSVP, invitation, registry, checklist and thank-you logic — all pure and
tested. The site sanitisation boundary. The Places verification layer.

**Known gaps, in rough order of how much they matter:**

1. **No vendor-side product at all.** No supplier route, no vendor account, no
   claim flow. The market research names the two-sided model as the revenue path,
   and the sending half of it already runs — but the receiving half does not exist.
2. **No co-planner.** `partner_email` is captured at onboarding and stored in a
   `requirements` JSON blob. A string exists — *"{email} er inviteret som
   medplanlægger"* — but there is no shared access. One account, one wedding, one
   person. Two people plan a wedding; this is a product hole, not a nice-to-have.
3. **i18n is ~two-thirds done.** Danish is the source; the English dictionary
   holds ~1,680 entries. Per `docs/i18n-audit.md`, roughly **330 strings** across
   Inbox, Budget, Guests, Seating, Invites, Website and the marketing site are
   still hardcoded literals. The system itself is N-language ready — adding
   Swedish or Norwegian is a config change plus a dictionary.
4. **Three colour palettes coexist.** `docs/DESIGN_SYSTEM.md` is the remediation
   spec: promote the Home screen's palette to canonical tokens and migrate every
   page. Partially applied.
5. **A legacy screen survives.** `Suppliers.tsx` uses a different vendor taxonomy
   (fotografi / video / blomster / bar / kage / beauty) than the backend
   (venue / florist / photographer / musician / caterer / planner / accommodation
   / other) and sits alongside the newer `VendorHub`.
6. **Polling, not push.** Five-minute Render cron instead of Gmail watch +
   Pub/Sub. Fine at current volume; a latency and cost problem later.
7. **Currency inconsistency.** Invitation print pricing is computed in **USD
   cents** while everything else in the product is DKK.
8. **The website unlock runs free when `STRIPE_SECRET_KEY` is unset** — correct
   for local development, dangerous if it ever ships that way.

**Vendor dependency.** Gemini, Places and Gmail are all Google. That is three
critical paths on one supplier's terms of service and pricing.
