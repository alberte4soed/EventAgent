# Kalas Knowledge Base

Written 2026-08-21 against commit `6ceb2f9`. This is the pull-from reference for
anyone writing about Kalas — pitch decks, grant applications, landing copy,
investor memos, onboarding a new hire, briefing an agency.

Every claim here is traceable to either the codebase or `docs/markedsundersoegelse.md`.
Where a number is a **hypothesis rather than a measurement**, it says so. Nothing in
this KB should be repeated externally without checking that flag first — the whole
point of the market-research plan is that borrowed American numbers are the weakest
thing you can put in front of a Danish grant panel.

| File | What it holds | Pull from it when |
|---|---|---|
| [`01-product.md`](01-product.md) | Functional deep dive — architecture, the agent, every screen, what is real vs. half-built | Writing docs, briefing engineers, demoing, due diligence |
| [`02-positioning.md`](02-positioning.md) | Category, ICP, competitive map, messaging, the three defensible claims | Landing pages, decks, sales, PR |
| [`03-value.md`](03-value.md) | Value model on three axes, the automation table, the savings arithmetic, evidence status | Grant applications, ROI claims, pricing conversations |
| [`04-gtm.md`](04-gtm.md) | Channels, sequencing, pricing options, the vendor-side wedge, the research plan | Growth planning, launch, Innofounder |
| [`05-roadmap.md`](05-roadmap.md) | Where the platform should go, in three horizons, with the reasoning | Strategy, prioritisation, fundraising narrative |
| [`06-facts.md`](06-facts.md) | Every number and its source, plus the open questions | Fact-checking anything before it ships |

## The one-paragraph version

Kalas is a conversational wedding planner for the Nordic market. A couple describes
their wedding to Ava in chat; she searches the live web for real venues and vendors,
verifies each one against Google Places, and puts them on a swipeable board. The
couple shortlists, approves **one** email, and Ava sends a personalised, complete
enquiry to every shortlisted vendor — in that vendor's own language — from a shared
platform mailbox. She then reads the replies, extracts price and availability, and
drafts the response for the couple to approve. Around that loop sits a full planning
suite: budget, guest list and RSVP, timeline and checklist, an AI-designed public
wedding site, invitations, gift registry, seating plan, honeymoon, and a post-wedding
phase. Ava can read and write all of it through 29 function-calling tools, and she
navigates the app on the couple's behalf while she talks.

**The category difference in one line:** every competitor is a directory plus static
tools. Kalas is the only one with an outbox.
