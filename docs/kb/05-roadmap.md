# 05 — The future of the platform

Three horizons. The ordering is not arbitrary: horizon 1 is what stops the current
product breaking or leaking, horizon 2 is what turns it into a business with a
second side, horizon 3 is what makes it a category rather than a product.

---

## Horizon 1 — make the current product safe to grow (next ~3 months)

Nothing here is new product. It is the set of things that will hurt precisely when
usage arrives.

### 1.1 Get the mailbox off a single Gmail account

**The problem.** Every user's outreach flows through one Workspace mailbox. Shared
sender reputation, shared rate limits, one account, one spam-report cascade away
from the core loop going dark for everyone. It is simultaneously the cleverest
thing in the architecture and the most fragile.

**The work.** Move sending to a transactional ESP (Postmark, Resend) on a dedicated
subdomain with proper SPF, DKIM and DMARC. Keep per-event subaddressing for
attribution — the matching logic is already pure and tested, so it survives the
move. Keep Gmail for receiving initially, but add **Gmail watch + Pub/Sub push**
instead of the five-minute poll: lower latency, lower cost, and replies that appear
while the couple is still looking at the screen. Add per-domain send throttling and
bounce/complaint handling.

This is unglamorous and it is the highest-leverage engineering on the list.

### 1.2 Ship co-planner access

Two people plan a wedding. `partner_email` is collected at onboarding and buried in
a JSON blob; the string *"{email} is invited as a co-planner"* exists with nothing
behind it. Real shared access — invite, join, both see the same wedding, both can
approve — is a genuine product hole and it also doubles the number of people who
experience the product per acquired couple.

### 1.3 Turn the guest layer on

Six public surfaces already reach every guest, with zero capture. A tasteful mark
and a waitlist link on the wedding site, the invitation and the guest photo upload.
Cheapest growth lever in the repository.

### 1.4 Fix the pricing inversion

The differentiated loop is free; the commodity website costs 499 kr. Move the price
onto outreach, keep website and print as add-ons, and stop the website unlock
running free when Stripe is unconfigured. Confirm the number against Q36/Q38 rather
than guessing.

### 1.5 Finish what is half-finished

~330 unwrapped strings (`docs/i18n-audit.md`), three coexisting colour palettes
(`docs/DESIGN_SYSTEM.md` is the spec), the legacy `Suppliers.tsx` screen with its
divergent taxonomy, and invitation pricing denominated in USD cents. Each is small.
Together they are what a diligence process finds and what makes a demo feel
unfinished.

### 1.6 Instrument the loop

There is currently no measurement of the thing the entire pitch rests on. Track:
enquiries sent, **response rate**, time-to-first-reply, quotes extracted per
enquiry, and how many quotes a couple ends up comparing. **These are the numbers
that prove the value proposition with production data instead of survey data**, and
by next year they should be the headline rather than the borrowed benchmarks.

---

## Horizon 2 — the second side (3–12 months)

### 2.1 The vendor claim flow

The single highest-value unbuilt thing. Every Ava enquiry already lands in a vendor
inbox. Add a link to a structured brief with one-click reply. No account to start;
an account to keep the profile.

It improves the couple's experience *and* creates the supply side in the same
motion — which is rare, and worth saying out loud in any fundraising narrative.

### 2.2 The vendor product, then vendor revenue

Claimed profile → availability calendar → structured quoting → reply-rate stats
("you answer in 4 hours; the local median is 11"). Then price it: qualified lead
fees or a subscription on claimed profiles. Vendors are annual and renewing, which
is the retention the consumer side structurally cannot have.

**Guard the incentive carefully.** The moment Kalas takes vendor money, the ranking
becomes a conflict of interest — and ranking integrity is exactly what distinguishes
Kalas from the directories it is displacing. Decide early and state publicly that
paid placement never alters the couple's ranking. That constraint is a positioning
asset, not a limitation.

### 2.3 Sweden and Norway

The Nordic expansion is more distribution than engineering: ~30 languages already
resolved for outreach, an N-language-ready i18n layer, and a search-and-verify
pipeline with nothing Denmark-specific in it. What *is* Denmark-specific is
content — the 205-item checklist encodes prøvelsesattest, salmer, sanghæfte,
toastmaster, brudevals før midnat, æresport. Each new market needs its own
equivalent, written by someone who has been to those weddings. That is the real
cost, and it is also a moat: a US incumbent will not write it.

Sweden first — comparable size, closest culture, and the brand is already a Swedish
word.

### 2.4 Contract and payment intelligence

Contract review already exists in the budget screen. Extend it: deposit schedules
into the timeline automatically, cancellation terms surfaced before signing,
payment reminders. This is the "nothing falls between two stools" axis, and it is
the part couples are most afraid of getting wrong.

### 2.5 Close the review loop

The Nygift phase collects vendor reviews from couples who genuinely used them. Feed
those into vendor profiles and into ranking. **This is the data asset that makes
the platform defensible** — verified reviews from confirmed bookings, tied to real
enquiries and real prices. It is what a directory cannot manufacture, and it is how
Kalas becomes bryllup.dk's replacement rather than a tool used alongside it.

---

## Horizon 3 — the category (12 months+)

### 3.1 Real price transparency

Every extracted quote is a data point: this vendor, this date, this guest count,
this price. At volume that becomes something no one in the Danish market has —
*"venues of this size in this region quote 62,000–91,000 kr for 80 guests in
August; yours is at the top of the band."*

That is a category-defining feature, it compounds with every enquiry sent, it is
impossible to bootstrap without the outreach loop, and it makes the money axis of
the value argument concrete rather than theoretical. **This is the strongest
long-term reason the outreach loop was worth building.**

Handle it carefully: aggregated and banded, never a named vendor's quote exposed to
a competitor, and vendors told plainly what is aggregated.

### 3.2 Negotiation and booking, at the boundary couples accept

Survey Q31 will say where the line is. The likely finding — couples want the agent
to write but not to answer — argues for progressive autonomy: the couple sets what
Ava may do unsupervised, and the default stays conservative. **Never move that
default without evidence**; the restraint is the trust asset.

### 3.3 Adjacent life events

The repo is named EventAgent and the tool schemas still carry generic event types.
The natural extensions are large parties with the same shape — significant
birthdays, confirmations, anniversaries, corporate events. Same loop: find, enquire,
compare, coordinate. Joy has already run this play, extending from weddings to
"all life events".

**Do not touch this before horizon 2 is working.** Weddings are a defensible wedge
precisely because they are specific — the 205-item Danish checklist, the venue-first
journey, the post-wedding phase. Generalising early trades the wedge for surface
area, and the graveyard of event-planning startups is full of companies that did
exactly that.

### 3.4 The realistic exit picture

Kalas ends up somewhere on a spectrum between a Nordic consumer app with a modest
ceiling and a two-sided marketplace with Danish vendor supply, verified reviews and
proprietary price data. **The vendor side is what separates those two outcomes**,
which is why horizon 2 is the pivotal one and why it should not slip.

---

## What could kill it

Stated plainly, because a strategy document that omits this is not credible.

| Risk | Assessment |
|---|---|
| **Mailbox reputation collapse** | The core loop dies for every user at once. Highest severity, and fully addressable — horizon 1.1 |
| **Google dependency** | Gemini, Places and Gmail are one supplier's pricing and terms across three critical paths. Abstract the model layer; the ESP move removes one leg |
| **An incumbent ships agentic outreach** | 12–24 month risk. Defence is the Nordic language and market layer plus vendor relationships, neither of which travels well for a US player |
| **Couples reject email sent in their name** | Q31 measures it directly. If the answer is no, the whole thesis needs rework — which is exactly why that question is in the survey rather than assumed away |
| **Vendors block or resent the outreach** | A genuine service enquiry is not marketing, but at volume from one sender it can start to look like it. Watch complaint rates from day one; the claim flow converts the risk into a relationship |
| **Model quality** | Places verifies existence and contact details, but "why it fits" and pricing hints are unverified model text. A confidently wrong price is a trust event. Label inferred fields as inferred |
| **No retention by design** | Structural, not fixable — which is why the guest layer, referral and the vendor side are strategy rather than nice-to-haves |
