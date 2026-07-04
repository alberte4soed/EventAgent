"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { EventRow, InviteOrderRow } from "@/lib/db/types";
import { ChipButton } from "@/components/ui/Chip";
import {
  INVITE_PALETTES,
  INVITE_QUANTITIES,
  INVITE_STYLES,
  orderAmountCents,
  suggestedQuantity,
} from "@/lib/invites";
import { dateKnown, venueChosen } from "@/lib/journey";

export interface DesignPreview {
  id: string;
  url: string | null;
  selected: boolean;
}

interface Props {
  event: EventRow;
  orders: InviteOrderRow[];
  checkoutResult: string | null;
  initialDesigns: DesignPreview[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid — sending to print soon",
  submitted_to_print: "At the printer",
  shipped: "Shipped 🎉",
  canceled: "Canceled",
};

export function InvitesPlanner({ event, orders, checkoutResult, initialDesigns }: Props) {
  const inviteBrief =
    (event.requirements?.invites as { wording?: string; style?: string } | undefined) ??
    {};
  const vibes = Array.isArray(event.requirements?.vibes)
    ? (event.requirements.vibes as string[])
    : [];

  // Default style follows the wedding vibe when it maps cleanly.
  const vibeDefault = useMemo(() => {
    const joined = vibes.join(" ").toLowerCase();
    if (/garden|boho|rustic/.test(joined)) return "botanical";
    if (/ballroom|castle|classic/.test(joined)) return "classic";
    if (/modern|loft/.test(joined)) return "modern";
    return null;
  }, [vibes]);

  const [style, setStyle] = useState<string>(inviteBrief.style ?? vibeDefault ?? "botanical");
  const [palette, setPalette] = useState<string>("cream_sage");
  const [quantity, setQuantity] = useState<number>(suggestedQuantity(event.guest_count));
  const [wording, setWording] = useState<string>(inviteBrief.wording ?? "");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [designs, setDesigns] = useState<DesignPreview[]>(initialDesigns);
  const [generating, setGenerating] = useState(false);
  const [designError, setDesignError] = useState<string | null>(null);
  const selectedDesign = designs.find((d) => d.selected) ?? null;

  const amount = orderAmountCents(quantity);
  const openOrder = orders.find((o) =>
    ["paid", "submitted_to_print", "shipped"].includes(o.status)
  );
  const ready = venueChosen(event) && dateKnown(event);

  async function generateDesigns() {
    setGenerating(true);
    setDesignError(null);
    try {
      const res = await fetch("/api/invites/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, style, palette, wording: wording.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Design generation failed");
      }
      const fresh: DesignPreview[] = (data.designs as { id: string; url: string | null }[]).map(
        (d) => ({ ...d, selected: false })
      );
      setDesigns((prev) => [...fresh, ...prev]);
    } catch (err) {
      setDesignError(err instanceof Error ? err.message : "Design generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function selectDesign(id: string) {
    setDesigns((prev) => prev.map((d) => ({ ...d, selected: d.id === id })));
    await fetch("/api/invites/design/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ designId: id }),
    });
  }

  async function checkout() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/invites/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          style,
          palette,
          wording: wording.trim() || null,
          quantity,
          designId: selectedDesign?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[11px] font-medium uppercase tracking-[1.5px]">Invitations</p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.7px] sm:text-4xl">
          Send the invites
        </h1>
        <p className="mt-2 text-[15px] text-[#7A8066]">
          Pick a style, settle the wording, order the prints — Ava fills in your
          date and venue automatically.
        </p>
      </motion.div>

      {checkoutResult === "success" && (
        <div className="mt-6 rounded-2xl border border-[#C4C8AE] bg-[#e3ece8] px-5 py-4 text-sm text-[#4d6b5c]">
          Payment received 🎉 Your invitations are being prepared for print.
        </div>
      )}
      {checkoutResult === "canceled" && (
        <div className="mt-6 rounded-2xl border border-[#D4D6C0] bg-[#ece8db] px-5 py-4 text-sm text-[#656952]">
          Checkout canceled — your order details are still here whenever you&apos;re ready.
        </div>
      )}

      {openOrder && (
        <div className="mt-6 rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4">
          <p className="text-sm font-semibold">
            Order: {openOrder.quantity} invitations
            {openOrder.style ? ` · ${openOrder.style}` : ""}
          </p>
          <p className="mt-1 text-xs text-[#7A8066]">
            {ORDER_STATUS_LABELS[openOrder.status] ?? openOrder.status}
            {openOrder.amount_cents
              ? ` · $${(openOrder.amount_cents / 100).toFixed(2)}`
              : ""}
          </p>
        </div>
      )}

      {!ready && (
        <div className="mt-6 rounded-2xl border border-[#e6c4bc] bg-[#f7ebe5] px-5 py-4 text-sm text-[#a8483a]">
          Invitations work best once your venue and date are locked —{" "}
          <Link href={`/events/${event.id}`} className="underline">
            finish those in the workspace
          </Link>{" "}
          first. You can still explore styles below.
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[1px] text-[#8a8568]">
          Style
        </h2>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {INVITE_STYLES.map((s) => (
            <ChipButton
              key={s.key}
              label={s.label}
              emoji={s.emoji}
              selected={style === s.key}
              onClick={() => setStyle(s.key)}
            />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-[1px] text-[#8a8568]">
          Palette
        </h2>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {INVITE_PALETTES.map((p) => (
            <ChipButton
              key={p.key}
              label={p.label}
              selected={palette === p.key}
              onClick={() => setPalette(p.key)}
            />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-sm font-semibold uppercase tracking-[1px] text-[#8a8568]">
          Quantity
        </h2>
        <p className="mt-1 text-xs text-[#8a8568]">
          {event.guest_count
            ? `Suggested for ~${event.guest_count} guests (about one card per household).`
            : "One card per household is the usual rule of thumb."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {INVITE_QUANTITIES.map((q) => (
            <ChipButton
              key={q}
              label={String(q)}
              selected={quantity === q}
              onClick={() => setQuantity(q)}
            />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[1px] text-[#8a8568]">
            Wording
          </h2>
          <Link
            href={`/events/${event.id}?prompt=${encodeURIComponent(
              "Draft our wedding invitation wording."
            )}`}
            className="text-xs font-medium text-[#7A8066] underline-offset-2 hover:underline"
          >
            Draft it with Ava →
          </Link>
        </div>
        <textarea
          value={wording}
          onChange={(e) => setWording(e.target.value)}
          rows={7}
          placeholder={
            "Together with their families,\nEmma & James\ninvite you to celebrate their wedding…"
          }
          className="mt-3 w-full rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-5 py-4 text-center font-[family-name:var(--font-fraunces)] text-[15px] leading-[1.8] outline-none transition focus:border-[#4A4E3C]"
        />
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[1px] text-[#8a8568]">
            Design
          </h2>
          <button
            type="button"
            disabled={generating || !wording.trim()}
            onClick={generateDesigns}
            className="rounded-full bg-[#4A4E3C] px-4 py-2 text-xs font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-40"
          >
            {generating
              ? "Designing…"
              : designs.length > 0
                ? "Generate more"
                : "Generate designs"}
          </button>
        </div>
        <p className="mt-1 text-xs text-[#8a8568]">
          Ava renders a few options from your style, palette and wording — pick your
          favourite. {designs.length > 0 && "Tap a design to select it."}
        </p>

        {designError && <p className="mt-2 text-xs text-[#a8483a]">{designError}</p>}

        {designs.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {designs.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDesign(d.id)}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition ${
                  d.selected ? "border-[#C2B280]" : "border-[#D4D6C0] hover:border-[#C4C8AE]"
                }`}
              >
                {d.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.url} alt="Invitation design" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#ece8db] text-xs text-[#8a8568]">
                    preview expired
                  </div>
                )}
                {d.selected && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#4A4E3C] text-[#F6F0E8]">
                    <svg stroke="currentColor" fill="none" strokeWidth="3" viewBox="0 0 24 24" className="size-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
            {generating &&
              [0, 1, 2].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="aspect-[3/4] animate-pulse rounded-xl border border-[#D4D6C0] bg-[#ece8db]"
                />
              ))}
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#D4D6C0] bg-[#F6F0E8] p-5 shadow-[0px_4px_20px_rgba(74,78,60,0.05)]">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold tracking-[-0.5px]">
            ${(amount / 100).toFixed(2)}
          </p>
          <p className="text-xs text-[#8a8568]">
            {quantity} printed invitations · ${(orderAmountCents(quantity) / quantity / 100).toFixed(2)} each · shipping included
          </p>
        </div>
        <button
          type="button"
          disabled={paying || !wording.trim()}
          onClick={checkout}
          className="rounded-full bg-[#4A4E3C] px-7 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47] disabled:opacity-40"
        >
          {paying ? "Redirecting…" : "Continue to payment →"}
        </button>
        {!wording.trim() && (
          <p className="w-full text-xs text-[#8a8568]">
            Add your wording (or have Ava draft it) to continue.
          </p>
        )}
        {error && <p className="w-full text-xs text-[#a8483a]">{error}</p>}
      </section>
    </div>
  );
}
