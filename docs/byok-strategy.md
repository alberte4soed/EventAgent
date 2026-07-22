# Bring-Your-Own-Key (BYOK): Strategy & Design

> Status: **Proposal for review** · Last updated: 2026-07-22
>
> Scope: let a customer supply their own LLM API key (OpenAI, Anthropic/Claude,
> Mistral, or Gemini) so their provider — not the platform's `GEMINI_API_KEY` —
> pays for the model calls, and define the flat pricing tier that sits on top.

## Decisions locked for this iteration

| Decision | Choice | Why |
| --- | --- | --- |
| Pricing shape | **Flat fee, everything folded in.** One price, no user-visible credits; the non-replaceable calls (web search + image generation) are covered by generous fair-use caps the platform absorbs. | Simplest to sell; and the workload here is naturally bounded (one wedding per couple), so the platform's residual cost per user is predictable. |
| Placement | **Settings → new "AI & connections" card**, per-user, mirroring the existing Gmail "Connect mailbox" card. | It's the only settings surface that exists today; BYOK is a per-account connection, not an org policy (there is no org model) and not a compliance disclosure. |
| Build order | **Strategy doc first (this file), then implement.** | Several substrate pieces (subscriptions, provider adapters) are net-new and depend on these decisions. |

---

## 1. The one fact that drives everything: this app is Gemini-native

Every model call in the codebase goes through Google's `@google/genai` SDK via a
single singleton that reads `process.env.GEMINI_API_KEY`
(`src/lib/gemini/client.ts`). Two of those capabilities are **Google-proprietary
and have no equivalent on OpenAI, Claude, or Mistral**:

- **Google Search grounding** (`tools:[{ googleSearch:{} }]`) — powers venue &
  vendor discovery (`execSearchVenues`) and contact-email lookup
  (`findVenueEmail`). This is the product's spine.
- **Image generation** (`gemini-2.5-flash-image`) — invitation designs and
  wedding-site imagery (`src/lib/gemini/image.ts`). **Claude and Mistral
  generate no images at all**; OpenAI can, but through an unrelated API.

So "replace the env key with theirs" is not one behavior — it splits by provider:

- **Bring a Gemini key → total offload.** Literally swap the key; text, grounded
  search, and images all run on the customer's account. Trivial to build.
- **Bring OpenAI / Claude / Mistral → only the "brain" moves.** Reasoning and
  text calls route to their key, but grounded search and image generation
  **must stay on the platform's Gemini key** — their provider cannot do those.

### Portable vs. Gemini-locked calls (Class A / Class B)

This is the map the whole system routes on.

| Call site | Class | Routable to customer key? |
| --- | --- | --- |
| Chat agent turn / reasoning loop (`runAgentTurn`) | **A** | Yes (needs function-calling translation) |
| Venue extraction from grounded text (`VENUE_EXTRACTION_PROMPT`) | **A** | Yes (structured JSON) |
| Email personalization (`personalizeEmail`) | **A** | Yes (plain text) |
| Outreach composition (`composeOutreachEmail`) | **A** | Yes (structured JSON) |
| Quote extraction (`extractQuote`) | **A** | Yes (structured JSON) |
| Reply-proposal drafting (`generateReplyProposal`) | **A** | Yes (plain text) |
| Website HTML build (`buildSite`) | **A** | Yes (text; Gemini-tuned prompt) |
| Grounded venue/vendor search (`execSearchVenues`, call A) | **B** | **No** — Google Search grounding |
| Grounded email lookup (`findVenueEmail`) | **B** | **No** — Google Search grounding |
| Invite / hero / section image generation (`image.ts`) | **B** | **No** (except BYO-Gemini or BYO-OpenAI-image later) |

Non-LLM variable cost that BYOK **never** offloads: **Google Places
verification** (every venue: match + details + photos), Gmail send/poll, and
Jina registry lookups. These always run on platform credentials.

---

## 2. Answering the pricing question directly

> *"Does the credit draw only apply to the models they're replacing?"*

Right instinct, but **inverted**. The cost-aligned principle is:

> **A call should stop drawing on the platform the moment it runs on the
> customer's key. Everything that still runs on *our* keys is what we meter or
> cap — and that set is exactly what the customer's provider *can't* replace.**

- BYO-Gemini → replaceable set is everything → platform's residual LLM cost ≈ 0.
- BYO-OpenAI/Claude/Mistral → the brain moves, but `{grounded search, image
  generation, Places verification}` stay on platform → that's the residual the
  flat fee must cover.

### Chosen model: flat fee, everything folded in

One price. The customer's key runs Ava's planning conversation **unlimited**
(they pay their provider directly). Web venue research and AI image design keep
running on platform infrastructure and are **included** — no credits shown, no
meter in the user's face.

**Why this is safe here specifically.** Consumer wedding planning is
*capacity-bounded*: one event, a finite set of venues and vendor categories, a
handful of invite/site images. The expensive Class-B tail (grounded searches +
images) is bounded by the nature of the task, not open-ended like a dev tool. So
the platform's residual cost per active user is predictable, and the flat fee can
be priced to cover p95 usage + margin and absorb the rest.

**Where BYOK actually saves us money.** The brain is the highest-*volume* LLM
usage — the agent loop chains up to `MAX_ITERATIONS = 6` model calls per turn,
many turns per session, plus per-vendor personalization/compose/quote calls.
Offloading that volume to the customer is the real win. Grounded search and
images are lower-frequency but higher unit cost — that bounded tail is what the
flat fee covers.

**The cost floor.** Even a full BYO-Gemini customer still costs us Google Places,
Gmail, Jina, Supabase, and hosting. The flat fee never goes to zero; that floor
sets the minimum viable price.

**Fair-use, not credits.** "Folded in" still needs a quiet backstop so a runaway
account (many events, image-regeneration hammering) can't invert the unit
economics. Caps are **invisible until hit**, set well above a normal journey, and
**degrade gracefully** rather than hard-failing the core flow:

| Metered internally (not shown as credits) | Suggested starting cap / active user / month | On breach |
| --- | --- | --- |
| Grounded searches (`search_venues` + `find_venue_email`) | ~50 | Soft-throttle; "still finding options — give it a moment" |
| AI image generations (invite + site) | ~40 | "You've hit this month's AI-design limit — resets {date}"; manual retry still allowed |
| Active events per account | ~5 | Prompt to archive an event before starting another |

> Instrument first, set caps second. Ship metering in shadow mode, watch two to
> four weeks of real distributions, then set caps at ~p95–p99. Numbers above are
> placeholders.

### Alternatives considered (recorded, not chosen)

- **Credits only for non-replaceable calls** — honest and perfectly cost-aligned
  (unlimited chat; search/images draw credits), but a two-axis mental model to
  explain. Rejected for launch simplicity; keep as the fallback if the Class-B
  tail turns out heavier-tailed than expected.
- **Full BYOK incl. a Gemini key** — customer brings a Gemini key too, so even
  search/images run on their dime → genuinely low flat platform fee. Rejected as
  the *default* (asks for two keys), but supported as a power-user path: a
  BYO-Gemini key is honored for Class B automatically (see §3).

---

## 3. Technical design — "replace the env key with theirs"

### 3.1 Where the key lives

New per-user table, RLS-scoped, encrypted with the **existing** `crypto.ts`
helper (`encrypt()`/`decrypt()`, AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) — the same
mechanism already protecting Gmail refresh tokens.

```sql
-- supabase/migrations/00XX_llm_credentials.sql
create table public.llm_credentials (
  user_id          uuid primary key references auth.users on delete cascade,
  provider         text not null check (provider in ('openai','anthropic','mistral','gemini')),
  key_enc          text not null,            -- crypto.encrypt(apiKey) → "iv.tag.ciphertext"
  key_hint         text not null,            -- last 4 chars only, for the UI ("sk-…a1b2")
  status           text not null default 'active'
                     check (status in ('active','invalid','disabled')),
  last_verified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.llm_credentials enable row level security;
-- owner may read/write only their own row; decryption happens server-side only.
create policy "own row" on public.llm_credentials
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

One active provider per user keeps routing unambiguous and matches the "replace
the key" mental model. (If simultaneous multi-provider is wanted later: make the
PK `(user_id, provider)` and add an `active_provider` pointer.) The plaintext key
**never leaves the server**; the client only ever sees `provider`, `key_hint`,
`status`.

### 3.2 Provider abstraction

New `src/lib/llm/` module exposing the three operations the codebase actually
uses, so call sites stop importing `@google/genai` directly:

```ts
interface LLMProvider {
  generateText(a: { system?: string; messages: Msg[] }): Promise<string>;
  generateJSON<T>(a: { system?: string; prompt: string; schema: JSONSchema }): Promise<T>;
  generateWithTools(a: { system?: string; contents: Turn[]; tools: ToolDef[] }): Promise<{
    text: string; toolCalls: ToolCall[]; raw: unknown;
  }>;
  readonly caps: { grounding: boolean; images: boolean };
}
```

Adapters: `gemini.ts` (wraps today's code — the reference implementation),
`openai.ts`, `anthropic.ts`, `mistral.ts`. Resolver:

```ts
// resolveTextProvider(userId): the customer's key if active, else platform Gemini.
// platformGemini(): always the env-key Gemini adapter — used for Class B + fallback.
```

**Routing rule, enforced in code (not config):**

- **Class A** call sites → `resolveTextProvider(event.user_id)`.
- **Class B** call sites (`execSearchVenues` grounding, `findVenueEmail`,
  `image.ts`) → `platformGemini()` **unconditionally** — *unless* the user's
  active provider is Gemini, in which case their key may serve Class B too (the
  drop-in offload path).

`runAgentTurn` already receives `event` (which carries `user_id`), and
`/api/chat/route.ts` runs with `user.id` in scope — so no signature churn is
needed to thread identity into routing.

### 3.3 The portability wrinkle (why Gemini is Phase 1)

The agent loop leans on Gemini specifics that each adapter must translate:

- **Tool-call round-tripping** — the loop pushes `responseContent` verbatim to
  preserve `thoughtSignature` (Gemini 2.5+/3.x). OpenAI and Anthropic use their
  own tool-call / tool-result message conventions; the adapter owns that
  translation.
- **Structured output** — `responseSchema` + `responseMimeType:"application/json"`
  maps to OpenAI `response_format: json_schema`, Anthropic tool-forcing/prefill,
  Mistral JSON mode.
- **Function declarations** — `Type.OBJECT` schemas map to each provider's tool
  schema shape.

Prompts in `prompts.ts` are Gemini-tuned; other models may need light prompt
and parse-tolerance adjustments. Several helpers already fall back gracefully
(e.g. `personalizeEmail`, `composeOutreachEmail`) — keep that pattern.

### 3.4 Validation, security, and the worker

- **Validate on save**: one cheap live call (models-list or 1-token completion)
  before storing; set `status`, `last_verified_at`, `key_hint`. Never echo the
  key back.
- **Security**: a stored provider key is a bigger blast radius than an OAuth
  refresh token — it's directly spendable. Encrypted at rest, decrypted only
  under the service role, **never logged**. Audit `logAgentError` /
  `summarizeContents` paths so a key can never leak into logs.
- **Broken-key policy** (decide before Phase 2): when a customer key fails
  (quota/revoked/bad model), either (a) surface "your key failed, fix it in
  Settings" and pause, or (b) silently fall back to the platform key (costs us
  money). Recommend surfacing + an explicit opt-in fallback.
- **The worker**: `worker/poll.ts` → `pollPlatformReplies` runs Class-A calls
  (`extractQuote`, `generateReplyProposal`) per reply, each carrying `user_id`,
  so it *can* resolve per-user via the admin client. These are low-volume;
  keeping them on the platform key in Phase 1 is acceptable, per-user resolution
  is a Phase 3 refinement.

---

## 4. UI — Settings → "AI & connections"

A new card on `src/app/settings/page.tsx`, structurally the Gmail
"Connect mailbox" card. States:

- **Not connected** — pick provider (OpenAI / Claude / Mistral / Gemini), paste
  key → validate → save.
- **Connected** — provider + `key_hint` + status dot + **Replace** / **Remove**.
- **Invalid** — warn, prompt to re-enter.

Copy (plain, sets expectations honestly):

> **Bring your own AI key.** When connected, your provider runs Ava's planning
> conversation on your account — unlimited. Live venue research and AI image
> design keep running on Kalas infrastructure and are included in your plan.
> Your key is encrypted, never logged, and used only for your account's
> requests.

New API routes: `POST /api/settings/llm-key` (auth'd; validate → encrypt →
upsert), `DELETE /api/settings/llm-key`, `GET` for status. The encryption
handling reassurance also belongs on a Trust/compliance page **if/when one
exists** — as a disclosure, not the functional store. (BYOK is frequently *sold*
as a compliance/trust feature: the customer's data goes to their model vendor
under their own DPA. That's the real B2B pull and a reason to surface it there
too.)

---

## 5. Rollout

| Phase | Ships | Notes |
| --- | --- | --- |
| **1 — Drop-in** | Provider abstraction + `llm_credentials` + Settings card + **BYO-Gemini** | Zero prompt translation; proves storage/routing/UI end-to-end and delivers real offload immediately. |
| **2 — Multi-provider text** | OpenAI + Anthropic + Mistral text adapters | The agent-loop + structured-output translation. Class B stays on platform Gemini. |
| **3 — Guardrails** | `usage_events` counter + soft-degrade + cost dashboard | Enforce fair-use; optional per-user worker resolution. |
| **4 — Packaging** | Recurring Stripe product + entitlement flag; gate BYOK behind the flat plan | Net-new: today Stripe is one-off checkouts only (`invite_orders`, `website_orders`) — there is no subscription substrate yet. |

## 6. Open items to confirm before building

1. **Broken-key behavior** — surface-and-pause vs. silent platform fallback (§3.4).
2. **Model tier per provider** — which OpenAI/Claude/Mistral model maps to the
   cheap/fast `gemini-3.1-flash-lite` tier the app is tuned around? Pick sane
   defaults, allow override. Confirm current model IDs at build time.
3. **Fair-use caps** — ship metering in shadow mode first; set numbers from real
   p95–p99 (§2).
4. **Subscription substrate** — Phase 4 needs a recurring Stripe plan +
   entitlement; scope separately.
5. **Org direction** — everything here is per-user. If EventAgent goes B2B, keys
   and the flat plan move to an org/tenant model (which doesn't exist yet) and
   this promotes from Settings to org settings.
