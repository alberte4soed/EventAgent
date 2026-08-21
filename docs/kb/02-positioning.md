# 02 — Positioning

## 1. The category claim

> **Every wedding platform is a directory with tools bolted on. Kalas is the only
> one with an outbox.**

That sentence is the whole positioning, and it survives scrutiny because it is a
statement about architecture rather than marketing. The Knot, Zola, bryllup.dk and
bryllupsklar.dk all do the same fundamental thing: they show a couple a list and a
set of forms, and the couple does the work. Kalas holds a live mailbox, writes to
real vendors in their own language, reads what comes back, and pulls the price out
of the email.

The distinction to hammer is **passive vs. active**:

| | Directories & tools | Kalas |
|---|---|---|
| Finding vendors | You browse a paid listing | Live web search, verified against Google Places |
| Contacting them | You copy-paste the same email 12 times | One approval → 12 personalised, complete enquiries |
| Language | Yours | The vendor's |
| Following up | You remember, or you don't | The mailbox is watched every five minutes |
| Comparing | You build a spreadsheet | Price and availability extracted automatically |
| Replying | You write it | Drafted for you; you approve |

A directory's incentive is to keep you browsing. An agent's incentive is to finish
the task. Those are different businesses.

## 2. Positioning statement

> For couples planning a wedding in Denmark who cannot justify 8,000–30,000 kr for
> a wedding planner, **Kalas** is a conversational planning agent that does the
> vendor legwork itself — finding, contacting, chasing and comparing — rather than
> handing you a longer list and a better spreadsheet. Unlike bryllupsklar.dk,
> bryllup.dk, The Knot or Zola, which are catalogues and static tools, Kalas has a
> real mailbox and sends real emails on your behalf, in each vendor's own language,
> and never sends one without your approval.

## 3. Who it is for

**Primary ICP — the "planner-shaped hole".** Danish couples, roughly 30–38,
marrying with 50–150 guests on a 100,000–250,000 kr budget, both working, planning
in 9–18 months. They have the need a wedding planner solves and not the budget a
wedding planner costs. Q23 in the survey is designed to size exactly this segment,
and the resulting sentence — *"X% considered a planner and Y% of them ruled it out
on price"* — is the single most legible number you can put in front of a panel or
an investor, because it describes people with a proven need and an unmet
willingness to pay.

**Secondary — the delegators.** Couples who would rather not do it at all. They
convert on "one approval, twelve emails", not on features.

**Explicitly not the ICP.** DIY maximalists who enjoy the spreadsheet, and the
high-budget segment that hires a real planner. Kalas competes with the planner on
price and with the spreadsheet on effort; it wins neither of those fights against
someone who has already chosen a side.

**The second customer — vendors.** Not served today, and the larger business. See
`04-gtm.md` §4 and `05-roadmap.md` horizon 2.

## 4. Competitive map

**International.** The Knot and WeddingWire share an owner; with Zola they
account for roughly **73% of AI-generated answers** to wedding questions — a
duopoly that is inheriting the AI-answer surface by default. Joy has raised
**$106.5M**. Newer AI-native planners: Losava, and Everly (Irish, pre-seed,
Enterprise Ireland backed).

**Danish.** `bryllup.dk` is a magazine, a fair operator and a vendor catalogue.
`bryllupsklar.dk` is checklists, budget, guest list and a forum with roughly
**1.3 million posts**. Both are real, both have audiences, and **neither does any
work for the couple.** There is no Danish-language AI planning agent in market.

**How to read that.** The duopoly is not the near-term threat — it is US-centric,
English-first, and its business model is vendor advertising, which is structurally
opposed to an agent that reduces browsing. The near-term threat is that a couple
opens ChatGPT instead. The answer to that is the same as the answer to the
directories: ChatGPT will give you a list, some of it invented, and then you still
have to send the twelve emails. Kalas verifies against Places, holds the mailbox,
and owns the thread.

**The real strategic risk** is that The Knot or Zola ships agentic outreach in
English and it works. That is a 12–24 month risk, and the defence is the Nordic
language and market layer plus the vendor-side relationship — neither of which
travels well for a US incumbent.

## 5. The three defensible claims

Use these; they are the ones that hold up when challenged.

**1. One approval, every enquiry — in their language.**
Not "AI writes emails". The specific, hard thing: a single reviewed template
becomes N personalised messages, each in the language the vendor actually reads,
sent from a real mailbox with a per-event reply address so the whole conversation
comes back into one place. The ~30-language resolver and the deliberate English
fallback for multilingual countries are engineering proof that this was taken
seriously.

**2. Structurally incapable of sending an incomplete enquiry.**
This is the sharpest and most under-used argument in the whole business. Vendors
ghost incomplete enquiries — the industry hypothesis is that **64% of vendors fail
to answer more than 40% of what they receive**, and that detailed enquiries get
around an **85% response rate** where generic ones do markedly worse. Kalas cannot
send a bad enquiry: date, guest count, location and budget live in the event record
before the agent will run a search at all. So Kalas's outbound is, by construction,
the kind vendors answer. **Better response rate for the couple and better lead
quality for the vendor are the same fact** — which is what makes the two-sided
revenue model credible rather than aspirational.

**3. It shows its work and stops at the line.**
Ava never claims to have sent something she hasn't. Drafts wait for approval.
Reply proposals wait for approval. Unattributable mail is labelled for a human
rather than guessed at. Model output is verified against Google Places before it
reaches a couple. In a market where "AI" mostly means "a chatbot that might be
making this up", **restraint is the feature** — and survey question 31 is designed
to find exactly where couples draw that line, which turns a trust posture into a
documented product insight.

## 6. Messaging

**Hero.** *One approval. Twelve emails. Every reply in one place.*

**Alternatives worth testing:**
- *A wedding planner's job, without a wedding planner's price.*
- *She doesn't give you a list. She writes to them.*
- *You'll approve one email. She sends the rest.*

**The demo that sells it** is not the chat and not the swipe deck. It is the inbox
filling with real replies and extracted prices while the couple does nothing. Lead
with the outcome, not the interface.

**Proof points to keep near the claim:** verified against Google Places, not
invented · written in the vendor's own language · nothing sends without your
approval · every thread lands in one inbox.

## 7. Naming and vocabulary

- The product is **Kalas**. The agent is **Ava**. Keep them distinct — "Ava" is
  what couples talk about and what vendors see in their inbox; "Kalas" is the
  company.
- Retire "event agent" and "EventAgent" externally. It is the repo name and a
  legacy framing; the product is a wedding platform.
- Danish first in all couple-facing copy. English is the translation, and the
  codebase is built that way round — that ordering is a positioning statement, not
  just an implementation detail.
- Do **not** describe Kalas as "an AI wedding planner" without the verb. The whole
  differentiator is what it *does*, and "AI wedding planner" is exactly what every
  competitor's next press release will say.
