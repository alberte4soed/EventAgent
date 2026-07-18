# Kalas Design System — UI & Component Consistency

**Source of truth for colors and components across the planning app.**
The **Home screen** (`src/kalas/screens/Home.tsx`) is the reference. Every
in-app planning screen should read from the tokens below — not from inline
hex, not from the marketing/website palette.

> Scope: the couple-facing planning app (`.theme-kalas` subtree — Home,
> Timeline, Venues, Vendor Hub, Budget, Guests, Invites, etc.). The public
> wedding **website** builder (`Website.tsx`, `SiteRenderer`, `PublicSite`)
> is intentionally a *separate* theme and is out of scope here.

---

## 1. The problem we're fixing

Three different palettes are live in the app at the same time:

| Palette | Where it lives | Forest green | Sage | Cards |
|---|---|---|---|---|
| **A — Home (keep this)** | `Home.tsx`, `Planning.tsx`, inline hex | `#314523` | `#8a9079` | `#fcfbf7` / white |
| **B — Old tokens** | `globals.css .theme-kalas`, used by Inbox/Budget/Guests/… | `#3B432A` (cooler) | `#A9B380` (brighter) | `#EDE6D6` (darker) |
| **C — Marketing / "website"** | landing `@theme`, leaking into Invites/Seating | `#3a4f37` | gold `#c9a227` | pinks/pastels |

They're close enough to look "almost right" and different enough to look
*off* when you move between pages. Two accent oranges also disagree:
`#b34e37` (Home/Timeline) vs `#e66b4e` (Shell/Onboarding/GuidedTour).

**Direction:** promote Palette A to the canonical tokens, repoint the
`.theme-kalas` variables at Home's values, and migrate every page to the
tokens. Nothing on Home changes visually — the rest of the app catches up
to it.

---

## 2. Canonical color tokens

Derived from the Home screen. These replace the current `.theme-kalas`
values in `src/app/globals.css`. Component code should reference the
Tailwind utility (`bg-surface`, `text-ink`, …) or the CSS var — **never a
raw hex.**

### Surfaces
| Token / utility | Hex | Use |
|---|---|---|
| `--color-canvas` → `bg-canvas` | `#f5f3ee` | App background (warm ivory) |
| `--color-surface` → `bg-surface` | `#fcfbf7` | Primary raised card (bright ivory) |
| `--color-surface-white` → `bg-white` | `#ffffff` | Stat / metric cards |
| `--color-card` → `bg-card` | `#ece9df` | Warm paper band (hero, section blocks) |
| `--color-shell` → `bg-shell` | `#f0ede5` | Inset tile / chip background |
| `--color-shell-hover` | `#e8e4da` | Tile hover |
| `--color-wash-sage` | `#eef1e6` | Completed / positive wash |
| `--color-wash-sage-2` | `#dce3d3` | Deeper sage wash (badges) |

### Ink & text
| Token / utility | Hex | Use |
|---|---|---|
| `--color-ink` → `text-ink` | `#314523` | Headings, primary text, primary buttons |
| `--color-ink-deep` | `#173c32` | Big stat numerals |
| `--color-ink-icon` | `#435337` | Icon strokes on light tiles |
| `--color-ink-soft` → `text-ink-soft` | `#59634f` | Secondary text |
| `--color-muted` → `text-muted` | `#6c7561` | Meta / descriptions |
| `--color-faint` → `text-faint` | `#8a9992` | Labels, captions |
| `--color-faint-2` | `#a6b0aa` | Footer, disabled captions |

### Lines (hairlines — the signature; never heavy shadows)
| Token | Hex | Use |
|---|---|---|
| `--color-line` | `#d8d4c7` | Standard border |
| `--color-line-2` | `#e4e0d4` | Soft inner border |
| `--color-line-3` | `#e0ddd2` | Section dividers |
| `--color-line-strong` | `#c4bfae` | Dashed / emphasis border |

### Accents
| Token / utility | Hex | Use |
|---|---|---|
| `--color-sage` → `bg-sage` / `text-sage` | `#8a9079` | Eyebrow labels, secondary accent, "active" step badge |
| `--color-sage-strong` | `#7a9068` | Sage hover / "done" text |
| `--color-terracotta` → `text-terracotta` | `#b34e37` | **The single accent.** Text links, `→` affordances, overdue |
| `--color-amber` | `#8a7d5c` | "In progress" status text |

> **Decision — unify the accent orange.** Standardize on **`#b34e37`**
> (the value on the Home page you like). Repoint Shell / Onboarding /
> GuidedTour's `#e66b4e` to it. If you'd rather keep the brighter coral for
> big interactive fills, keep exactly one variable (`--color-terracotta`)
> and pick its value once — don't ship both.

---

## 3. Component standards

All measurements match what Home/Timeline already do. Prefer the shared
primitives in `src/kalas/ui.tsx`; extend them rather than re-styling inline.

### Page frame
- Padding: `px-6 py-8 sm:px-9 lg:px-12` (already exported as `pagePad` in `ui.tsx`).
- Background: `bg-canvas`.
- Section rhythm: `flex flex-col gap-10` between major sections.

### Card
- Radius: `rounded-[28px]` (major panels), `rounded-2xl`/`rounded-[18px]` (rows & tiles).
- Border: `border border-line` (i.e. `#d8d4c7`). One hairline, no drop shadow at rest.
- Fill: `bg-surface` (`#fcfbf7`) for content cards; `bg-card` (`#ece9df`) for warm bands; `bg-white` for stat cards.
- Hover (interactive cards): `hover:shadow-[0_8px_24px_rgba(49,69,35,0.06)]` — a *whisper*, not a lift.

### Buttons / Pills (use `Pill` from `ui.tsx`)
- Height `h-8`, `rounded-full`, `text-xs font-semibold`.
- **Primary:** `bg-ink text-canvas` (forest on ivory) — e.g. `#314523` / `#f7f5ef`.
- **Ghost link:** `text-terracotta` with `→`.
- **Secondary:** `border border-line text-ink hover:bg-card`.

### Chips / status (use `Chip` from `ui.tsx`)
- `rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em]`.
- Neutral → `text-muted` + hairline. Sage/success → sage washes above.

### Section header (use `SectionHead` + `Eyebrow`)
- Eyebrow: uppercase, `tracking-[0.22em]`, `text-sage` (`#8a9079`).
- Title: serif `display`, `text-ink`.

### Typography
- Display / headings: `--font-serif` (Cormorant) via the `.display` / heading rules.
- Body & labels: `--font-sans` (Hanken).
- Eyebrows use the `.eyebrow` class; section labels use `.subheading`.

---

## 4. Page-by-page audit & migration checklist

Legend: ✅ on Home palette · 🟡 mixed (hex + tokens) · 🔴 old/off-brand palette

### On the target palette (reference-quality)
- ✅ **Home** (`screens/Home.tsx`) — reference. *Action:* swap its inline hex for tokens so it stays the source, but no visual change.
- ✅ **Timeline** (`screens/Planning.tsx`) — matches Home. Tokenize inline hex.
- ✅ **Booked** (`screens/team/BookedPanel.tsx`) — matches. Tokenize.
- ✅ **Shortlist** (`screens/team/ShortlistPanel.tsx`) — matches. Tokenize.
- ✅ **Suppliers** (`screens/Suppliers.tsx`) — mostly matches. Tokenize + drop stray token/hex mix.
- ✅ **Hub chrome** (`team/HubTabBar.tsx`, `team/CategoryFilterBar.tsx`) — matches.
- ✅ **Shell / nav** (`Shell.tsx`) — matches, **except** accent `#e66b4e` → unify to `--color-terracotta`.

### Mixed — reconcile
- 🟡 **Venues** (`screens/Venues.tsx`) — the biggest offender: ~226 inline hex *and* ~107 token utilities in one file. Same forest appears as both `#314523` and `text-ink` (`#3B432A`). *Action:* pick tokens throughout; delete the parallel hex. This file alone will make the "Explore" flow feel consistent.

### Not yet updated — still on the OLD token palette (Palette B)
These render with the cooler `#3B432A` green, brighter `#A9B380` sage and
darker `#EDE6D6` cards, so they read subtly colder than Home. **Fixed for
free** once `.theme-kalas` is repointed at Home's values (§2) — no per-file
edits needed beyond verifying:
- 🔴 **Inbox** (`screens/Inbox.tsx`, shown in hub via `InboxPanel`) — pure tokens.
- 🔴 **Budget** (`screens/Budget.tsx`) — pure tokens.
- 🔴 **Guests** (`screens/Guests.tsx`) — pure tokens.
- 🔴 **Registry** (`screens/Registry.tsx`) — pure tokens.
- 🔴 **Ava** (`screens/Ava.tsx`) — pure tokens (+ deep teal `#173c32`, keep as `--color-ink-deep`).

### Off-brand — using the marketing / website palette (Palette C)
Real per-file work; these don't just need retokening, they need recoloring.
- 🔴 **Invites** (`screens/Invites.tsx`) — gold `#c9a227`, pinks `#f4cecc`/`#fdf2f0`, marketing green `#3a4f37`. Rebuild on forest + terracotta.
- 🔴 **Seating** (`screens/Seating.tsx`) — marketing green `#3a4f37` + multi-hue table colors (`#4A7A9B`, `#5A7A5A`, `#7A6A9B`…). Keep functional table hues if needed, but derive them from a controlled sage/clay set and fix the chrome to forest.

### The "middle" flows the hub stitches together
- **Explore** → `ExplorePanel` renders **Venues** (🟡) + **Suppliers** (✅).
- **Shortlist** → `ShortlistPanel` (✅).
- **Inbox** → `InboxPanel` → **Inbox** (🔴 old tokens).
- **Booked** → `BookedPanel` (✅).
- **Similarity** ("Find flere som disse" / similar venues) → lives in `Venues.tsx` `DiscoverView` (🟡).
- **Draft** (outreach email review) → `Venues.tsx` `OutreachReview` + Suppliers outreach (🟡).

So: the whole **Vendor Hub is consistent except the Inbox tab and the
Venues-driven Explore/Similarity/Draft views.** Fixing `Inbox.tsx`
(via token repoint) and `Venues.tsx` (retokenize) makes the entire hub
uniform.

---

## 5. Migration order (lowest risk → highest value)

1. **Repoint `.theme-kalas` tokens** in `globals.css` to the §2 values, and add the missing utilities (`bg-surface`, `text-faint`, `text-terracotta`, etc.). → Instantly aligns every Palette-B page (Inbox, Budget, Guests, Registry, Ava). No component edits.
2. **Unify the accent orange** → one `--color-terracotta` (`#b34e37`); replace `#e66b4e` in Shell/Onboarding/GuidedTour.
3. **Tokenize `Venues.tsx`** → remove the hex/token split. Biggest single consistency win for the hub.
4. **Tokenize the ✅ pages** (Home, Timeline, Booked, Shortlist, Suppliers, hub chrome) → mechanical hex→token swap, no visual change, locks in the system.
5. **Recolor the 🔴 off-brand pages** (Invites, Seating) → real design work onto forest + terracotta.
6. **Guardrail:** add an ESLint rule / CI grep forbidding raw `#` hex colors inside `src/kalas/**` (allowlist `globals.css`).

---

## 6. Quick reference — the palette at a glance

```
BACKGROUNDS   #f5f3ee canvas   #fcfbf7 surface   #ece9df card   #f0ede5 shell   #ffffff stat
FOREST        #314523 ink      #173c32 deep      #435337 icon
TEXT          #59634f soft     #6c7561 muted     #8a9992 faint  #a6b0aa faint-2
SAGE          #8a9079 sage     #7a9068 strong    #eef1e6 wash   #dce3d3 wash-2
LINES         #d8d4c7 line     #e4e0d4 line-2    #e0ddd2 line-3 #c4bfae strong
ACCENT        #b34e37 terracotta (links / → / overdue)   #8a7d5c amber (in-progress)
```
