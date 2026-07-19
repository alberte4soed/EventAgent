"use client";

/* Code-drawn product vignettes for the landing page — stylized, honest
   miniatures of real app surfaces (chat, discovery, outreach, quotes,
   budget, guests, website, timeline). Drawn in code rather than screenshots
   so they stay crisp at any size and never rot when the UI shifts. */

import { cn } from "@/lib/utils";

/* Palette lifted from the app itself. */
const INK = "#314523";
const MUTED = "#6c7561";
const LINE = "#e4e0d4";
const CARD = "#fcfbf7";
const SHELL = "#f4f0e7";
const SAGE = "#eef1e6";
const TERRA = "#b3543e";

function Dot({ className }: { className?: string }) {
  return <span className={cn("h-2 w-2 rounded-full", className)} />;
}

/** Shared window chrome so every vignette reads as the same product. */
function MockShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border" style={{ borderColor: LINE, backgroundColor: CARD }}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: LINE, backgroundColor: SHELL }}>
        <div className="flex gap-1.5">
          <Dot className="bg-[#ddd6c0]" />
          <Dot className="bg-[#cfc8ae]" />
          <Dot className="bg-[#c2b280]" />
        </div>
        <span className="ml-1 truncate text-[10px] font-medium uppercase tracking-[1.2px]" style={{ color: MUTED }}>
          {label}
        </span>
      </div>
      {/* Fixed height (not aspect) so wide and narrow bento cards align. */}
      <div className="h-[300px] overflow-hidden p-4 sm:h-[320px] sm:p-5">{children}</div>
    </div>
  );
}

function Pill({ children, dark, className }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold",
        className
      )}
      style={dark ? { backgroundColor: INK, color: "#f7f5ef" } : { backgroundColor: SAGE, color: INK }}
    >
      {children}
    </span>
  );
}

/* ── 01 · Chat ─────────────────────────────────────────────────────────── */
function ChatMockup() {
  return (
    <div className="flex h-full flex-col justify-end gap-2.5">
      <div className="self-end rounded-2xl rounded-br-md px-3.5 py-2.5 text-[12px] leading-snug text-[#f7f5ef]" style={{ backgroundColor: INK, maxWidth: "78%" }}>
        We&apos;re thinking ~35 guests, by the sea on Bornholm, autumn 2027. Intimate, not stiff.
      </div>
      <div className="rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-[12px] leading-snug" style={{ borderColor: LINE, backgroundColor: "#ffffff", color: MUTED, maxWidth: "85%" }}>
        Lovely brief. I found seaside venues that fit an intimate autumn party — take a look:
      </div>
      <div className="flex gap-2">
        {["Melsted Badehotel", "Dragsholm Castle", "Herthadalen"].map((name, i) => (
          <div key={name} className="min-w-0 flex-1 overflow-hidden rounded-xl border" style={{ borderColor: LINE, backgroundColor: "#fff" }}>
            <div className="h-10" style={{ background: `linear-gradient(135deg, ${["#c9cdb4", "#b8c2ab", "#d4cdb6"][i]}, ${["#a8b394", "#98a68b", "#c2b280"][i]})` }} />
            <div className="px-2 py-1.5">
              <p className="truncate font-[family-name:var(--font-fraunces)] text-[10.5px] font-semibold" style={{ color: INK }}>{name}</p>
              <p className="text-[9px]" style={{ color: MUTED }}>★ {["4.5", "4.8", "4.6"][i]} · seats {["60", "120", "80"][i]}</p>
            </div>
          </div>
        ))}
      </div>
      <Pill className="self-start">5 venues added to your board</Pill>
    </div>
  );
}

/* ── 02 · Discovery ───────────────────────────────────────────────────── */
function VendorsMockup() {
  const cats = ["All", "Venue", "Photo", "Flowers", "Catering", "Music"];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c, i) => (
          <span key={c} className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={i === 1 ? { backgroundColor: INK, color: "#f7f5ef" } : { backgroundColor: SAGE, color: MUTED }}>
            {c}
          </span>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2.5">
        {[
          ["Kokkedal Slot", "4.7", "Historic castle by the sound"],
          ["Villa Toscana", "4.9", "Vineyard terrace, Tuscany"],
          ["The Ivy Barn", "4.6", "Restored Cotswolds barn"],
        ].map(([name, rating, blurb], i) => (
          <div key={name} className="flex min-w-0 flex-col overflow-hidden rounded-xl border" style={{ borderColor: LINE, backgroundColor: "#fff" }}>
            <div className="h-16" style={{ background: `linear-gradient(160deg, ${["#ccd2b9", "#d8ceae", "#c5cbb2"][i]}, ${["#9fae8e", "#c2b280", "#8fa183"][i]})` }} />
            <div className="flex flex-1 flex-col px-2.5 py-2">
              <p className="truncate font-[family-name:var(--font-fraunces)] text-[11px] font-semibold" style={{ color: INK }}>{name}</p>
              <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug" style={{ color: MUTED }}>{blurb}</p>
              <div className="mt-auto flex items-center justify-between pt-1.5">
                <span className="text-[9px] font-semibold" style={{ color: INK }}>★ {rating}</span>
                <span className="rounded-full px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide" style={{ backgroundColor: SAGE, color: INK }}>Save</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[10px]" style={{ color: MUTED }}>Real venues, researched live — ratings, capacity and contacts verified</p>
    </div>
  );
}

/* ── 03 · Outreach ────────────────────────────────────────────────────── */
function OutreachMockup() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[1.2px]" style={{ color: MUTED }}>Ava is writing to</p>
          <p className="truncate font-[family-name:var(--font-fraunces)] text-[15px] font-semibold" style={{ color: INK }}>Villa Toscana</p>
        </div>
        <Pill>🌐 Written in Italian</Pill>
      </div>
      <div className="mt-3 flex-1 space-y-1.5 overflow-hidden rounded-xl border px-3.5 py-3 text-[11px] leading-relaxed" style={{ borderColor: LINE, backgroundColor: "#fff", color: MUTED }}>
        <p style={{ color: INK }}>Gentile staff di Villa Toscana,</p>
        <p>ci siamo innamorati della vostra terrazza sui vigneti — sarebbe lo sfondo perfetto per il nostro matrimonio…</p>
        <p className="truncate">Prevediamo circa 35 invitati per l&apos;autunno 2027. Avreste disponibilità…</p>
        <p className="pt-1" style={{ color: INK }}>Cordiali saluti,<br />Ava, per conto della coppia</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[10px]" style={{ color: MUTED }}>Nothing sends without you</p>
        <span className="rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#f7f5ef]" style={{ backgroundColor: INK }}>
          Approve &amp; send
        </span>
      </div>
    </div>
  );
}

/* ── 04 · Quotes ──────────────────────────────────────────────────────── */
function QuotesMockup() {
  const rows: [string, string, string, boolean][] = [
    ["Melsted Badehotel", "DKK 118,000", "Sep 18 available", true],
    ["Dragsholm Castle", "DKK 164,500", "Sep 25 available", false],
    ["Herthadalen", "DKK 96,000", "Waitlist for Sep", false],
  ];
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-fraunces)] text-[14px] font-semibold" style={{ color: INK }}>Quotes, side by side</p>
        <Pill>3 replies in</Pill>
      </div>
      {rows.map(([name, price, avail, best]) => (
        <div key={name} className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-2.5", best && "ring-1")}
          style={{ borderColor: best ? INK : LINE, backgroundColor: "#fff", ...(best ? { boxShadow: "0 6px 18px -8px rgba(49,69,35,0.35)" } : null) }}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-[family-name:var(--font-fraunces)] text-[12px] font-semibold" style={{ color: INK }}>{name}</p>
            <p className="text-[9.5px]" style={{ color: MUTED }}>{avail} · full weekend hire</p>
          </div>
          <p className="text-[13px] font-semibold tabular-nums" style={{ color: INK }}>{price}</p>
          {best && <Pill dark>Best fit</Pill>}
        </div>
      ))}
      <p className="text-[10px]" style={{ color: MUTED }}>Prices, dates and conditions pulled out of every reply — automatically</p>
    </div>
  );
}

/* ── 05 · Budget ──────────────────────────────────────────────────────── */
function BudgetMockup() {
  const rows: [string, string, number, string][] = [
    ["Venue & food", "118,000", 72, "#8fa183"],
    ["Photographer", "24,000", 55, "#c2b280"],
    ["Flowers", "9,500", 38, "#b8c2ab"],
    ["Music", "12,000", 20, "#ddd6c0"],
  ];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[1.2px]" style={{ color: MUTED }}>Total budget</p>
          <p className="font-[family-name:var(--font-fraunces)] text-[20px] font-semibold" style={{ color: INK }}>DKK 250,000</p>
        </div>
        <Pill>DKK 163,500 committed</Pill>
      </div>
      <div className="flex-1 space-y-2.5">
        {rows.map(([label, amount, pct, color]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-[10.5px]">
              <span style={{ color: INK }}>{label}</span>
              <span className="tabular-nums" style={{ color: MUTED }}>DKK {amount}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: SAGE }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: MUTED }}>Every deposit and quote lands here on its own — flagged before anything tips over</p>
    </div>
  );
}

/* ── 06 · Guests ──────────────────────────────────────────────────────── */
function GuestsMockup() {
  const rows: [string, string, string][] = [
    ["Alberte Holm", "Yes", "Fish"],
    ["Jonas Krag", "Yes", "Veg"],
    ["Nour El-Sayed", "Pending", "—"],
    ["Marta Rossi", "Yes", "Meat"],
  ];
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-fraunces)] text-[14px] font-semibold" style={{ color: INK }}>Guest list</p>
        <Pill>28 of 35 replied</Pill>
      </div>
      <div className="flex-1 divide-y overflow-hidden rounded-xl border" style={{ borderColor: LINE, backgroundColor: "#fff" }}>
        {rows.map(([name, rsvp, meal]) => (
          <div key={name} className="flex items-center gap-3 px-3.5 py-2" style={{ borderColor: LINE }}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: SAGE, color: INK }}>
              {name.split(" ").map((n) => n[0]).join("")}
            </span>
            <p className="min-w-0 flex-1 truncate text-[11.5px]" style={{ color: INK }}>{name}</p>
            <span className="text-[9.5px]" style={{ color: MUTED }}>{meal}</span>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={rsvp === "Yes" ? { backgroundColor: SAGE, color: INK } : { backgroundColor: "#f5ece4", color: TERRA }}>
              {rsvp}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: MUTED }}>RSVPs, meals and plus-ones update themselves as replies come in</p>
    </div>
  );
}

/* ── 07 · Website ─────────────────────────────────────────────────────── */
function WebsiteMockup() {
  return (
    <div className="flex h-full items-stretch gap-3">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border" style={{ borderColor: LINE, backgroundColor: "#fff" }}>
        <div className="flex items-center gap-1.5 border-b px-3 py-1.5" style={{ borderColor: LINE, backgroundColor: SHELL }}>
          <Dot className="bg-[#ddd6c0]" />
          <Dot className="bg-[#cfc8ae]" />
          <span className="ml-1 truncate rounded-full bg-white px-2 py-0.5 text-[8.5px]" style={{ color: MUTED }}>alberte-espen.kalas.dk</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-3 text-center" style={{ background: "linear-gradient(180deg, #faf7f0, #f1ead9)" }}>
          <p className="text-[8px] font-semibold uppercase tracking-[2px]" style={{ color: TERRA }}>12 · 09 · 2027</p>
          <p className="font-[family-name:var(--font-fraunces)] text-[18px] font-semibold leading-tight" style={{ color: INK }}>Alberte &amp; Espen</p>
          <p className="text-[9px]" style={{ color: MUTED }}>Melsted Badehotel · Bornholm</p>
          <span className="mt-1.5 rounded-full px-3 py-1 text-[8.5px] font-bold uppercase tracking-wide text-[#f7f5ef]" style={{ backgroundColor: INK }}>RSVP</span>
        </div>
      </div>
      <div className="flex w-[86px] shrink-0 flex-col justify-between">
        <div className="overflow-hidden rounded-[14px] border p-[3px]" style={{ borderColor: LINE, backgroundColor: "#101010" }}>
          <div className="flex aspect-[9/16] flex-col items-center justify-center gap-1 rounded-[11px] px-1.5 text-center" style={{ background: "linear-gradient(180deg, #faf7f0, #eee5d0)" }}>
            <p className="font-[family-name:var(--font-fraunces)] text-[9px] font-semibold leading-tight" style={{ color: INK }}>Alberte<br />&amp; Espen</p>
            <span className="rounded-full px-2 py-0.5 text-[6.5px] font-bold uppercase text-[#f7f5ef]" style={{ backgroundColor: INK }}>RSVP</span>
          </div>
        </div>
        <Pill className="justify-center">Live ✓</Pill>
      </div>
    </div>
  );
}

/* ── 08 · Timeline ────────────────────────────────────────────────────── */
function TimelineMockup() {
  const items: [string, string, "done" | "now" | "next"][] = [
    ["Venue booked", "Melsted Badehotel · deposit paid", "done"],
    ["Book your photographer", "3 quotes in — pick this week", "now"],
    ["Send save-the-dates", "Opens once the guest list is set", "next"],
    ["Menu tasting", "Ava proposes dates in March", "next"],
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-1">
      {items.map(([title, sub, state], i) => (
        <div key={title} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
              style={
                state === "done"
                  ? { backgroundColor: INK, color: "#f7f5ef" }
                  : state === "now"
                    ? { backgroundColor: "#fff", color: INK, boxShadow: `inset 0 0 0 2px ${INK}` }
                    : { backgroundColor: SAGE, color: MUTED }
              }
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            {i < items.length - 1 && <span className="w-px flex-1" style={{ backgroundColor: LINE }} />}
          </div>
          <div className={cn("pb-3", state === "now" && "-mx-2 -mt-1 flex-1 rounded-xl px-2 pt-1")}
            style={state === "now" ? { backgroundColor: SAGE } : undefined}>
            <p className="text-[12px] font-semibold" style={{ color: state === "next" ? MUTED : INK }}>
              {title} {state === "now" && <span className="ml-1 rounded-full px-1.5 py-0.5 align-middle text-[8px] font-bold uppercase text-[#f7f5ef]" style={{ backgroundColor: TERRA }}>Now</span>}
            </p>
            <p className="text-[10px]" style={{ color: MUTED }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── registry ─────────────────────────────────────────────────────────── */
const MOCKUPS: Record<string, { label: string; Component: () => React.ReactNode }> = {
  meet: { label: "Chat · brief to shortlist", Component: ChatMockup },
  vendors: { label: "Discovery · matched venues", Component: VendorsMockup },
  outreach: { label: "Outreach · approve before send", Component: OutreachMockup },
  quotes: { label: "Inbox · quotes compared", Component: QuotesMockup },
  budget: { label: "Budget · live tracking", Component: BudgetMockup },
  guests: { label: "Guests · RSVPs live", Component: GuestsMockup },
  website: { label: "Website · alberte-espen.kalas.dk", Component: WebsiteMockup },
  timeline: { label: "Timeline · what's next", Component: TimelineMockup },
};

export function CapabilityMockup({ id }: { id: string }) {
  const entry = MOCKUPS[id] ?? MOCKUPS.meet;
  return (
    <MockShell label={entry.label}>
      <entry.Component />
    </MockShell>
  );
}
