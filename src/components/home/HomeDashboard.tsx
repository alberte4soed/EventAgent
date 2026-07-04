"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { EventRow, EventStatus, ProfileRow } from "@/lib/db/types";
import { EVENT_TEMPLATES } from "@/lib/db/profile";
import { StatusChip } from "@/components/ui/StatusChip";
import { JourneyTimeline } from "@/components/home/JourneyTimeline";
import type { JourneyExtras } from "@/lib/journey";

interface Props {
  profile: ProfileRow;
  events: EventRow[];
  stats: { venuesLiked: number; quotesIn: number; emailsSent: number };
  activeEvent: EventRow | null;
  activeExtras: JourneyExtras;
}

const PROGRESS: Record<EventStatus, number> = {
  gathering: 12,
  searching: 30,
  swiping: 50,
  drafting: 66,
  sending: 80,
  awaiting_replies: 90,
  done: 100,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(iso: string): number | null {
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function HomeDashboard({
  profile,
  events,
  stats,
  activeEvent,
  activeExtras,
}: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const firstName = (profile.display_name ?? "").split(" ")[0] || "there";
  const partnerFirst = (profile.partner_name ?? "").split(" ")[0] || null;

  const countdown = activeEvent?.event_date ? daysUntil(activeEvent.event_date) : null;
  const dateLine = activeEvent
    ? countdown !== null && countdown >= 0
      ? `${countdown} day${countdown === 1 ? "" : "s"} to go`
      : activeEvent.date_hint ?? null
    : null;

  // Favourite templates first, then the rest — capped for a tidy row.
  const favored = profile.event_interests ?? [];
  const templates = [...EVENT_TEMPLATES].sort(
    (a, b) => Number(favored.includes(b.key)) - Number(favored.includes(a.key))
  );

  function start(text: string) {
    const q = text.trim();
    router.push(q ? `/events/new?prompt=${encodeURIComponent(q)}` : "/events/new");
  }

  const active = events.filter((e) => e.status !== "done");
  const done = events.filter((e) => e.status === "done");

  return (
    <main className="min-h-screen bg-[#F6F0E8] text-[#4A4E3C]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#D4D6C0] bg-[#F6F0E8]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/home"
            className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#4A4E3C]"
          >
            kalas
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/events" className="rounded-full px-3.5 py-2 text-sm text-[#656952] transition hover:bg-[#ece8db]">
              Weddings
            </Link>
            <Link href="/settings" className="rounded-full px-3.5 py-2 text-sm text-[#656952] transition hover:bg-[#ece8db]">
              Settings
            </Link>
            <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4D6C0] bg-[#F6F0E8] text-lg">
              {profile.accent}
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Greeting / wedding hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeEvent ? (
            <>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.9px] sm:text-5xl">
                {partnerFirst ? `${firstName} & ${partnerFirst}` : `${greeting()}, ${firstName}`}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-[#7A8066]">
                {activeEvent.location && <span>{activeEvent.location}</span>}
                {dateLine && (
                  <span className="rounded-full bg-[#c2b280] px-3 py-1 text-xs font-semibold text-[#4A4E3C]">
                    {dateLine}
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.9px] sm:text-5xl">
                {greeting()}, {firstName}.
              </h1>
              <p className="mt-2 text-[15px] text-[#7A8066]">
                Where are you in the wedding planning{profile.home_city ? ` — ${profile.home_city}` : ""}?
              </p>
            </>
          )}
        </motion.div>

        {/* Journey */}
        {activeEvent && <JourneyTimeline event={activeEvent} extras={activeExtras} />}

        {/* Quick-start stays front and center only when no wedding is active */}
        {!activeEvent && (
          <QuickStart
            templates={templates}
            favored={favored}
            prompt={prompt}
            setPrompt={setPrompt}
            onStart={start}
          />
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Stat label="Weddings planned" value={events.length} emoji="💍" delay={0.15} />
          <Stat label="Venues liked" value={stats.venuesLiked} emoji="❤️" delay={0.22} />
          <Stat label="Quotes in" value={stats.quotesIn} emoji="📊" delay={0.29} />
        </div>

        {/* Active events */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px]">
              {active.length > 0 ? "In progress" : "Your weddings"}
            </h2>
            {events.length > 0 && (
              <Link href="/events" className="text-sm text-[#7A8066] hover:text-[#4A4E3C]">
                View all →
              </Link>
            )}
          </div>

          {events.length === 0 ? (
            <EmptyState onStart={() => start("")} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(active.length > 0 ? active : done).map((event, i) => (
                <EventCard key={event.id} event={event} delay={i * 0.05} />
              ))}
            </div>
          )}

          {active.length > 0 && done.length > 0 && (
            <>
              <h3 className="mb-4 mt-10 text-sm font-medium uppercase tracking-[1px] text-[#8a8568]">
                Wrapped up
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {done.map((event, i) => (
                  <EventCard key={event.id} event={event} delay={i * 0.05} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Demoted quick-start when a wedding is already underway */}
        {activeEvent && (
          <section className="mt-12">
            <h2 className="mb-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px]">
              Planning something else?
            </h2>
            <QuickStart
              templates={templates}
              favored={favored}
              prompt={prompt}
              setPrompt={setPrompt}
              onStart={start}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function QuickStart({
  templates,
  favored,
  prompt,
  setPrompt,
  onStart,
}: {
  templates: (typeof EVENT_TEMPLATES)[number][];
  favored: string[];
  prompt: string;
  setPrompt: (v: string) => void;
  onStart: (text: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="mt-7 rounded-3xl border border-[#D4D6C0] bg-[#F6F0E8] p-5 shadow-[0px_4px_20px_rgba(74,78,60,0.05)]"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] px-4 py-3">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onStart(prompt)}
          placeholder='Describe your wedding — "Garden ceremony in Copenhagen for 120 guests"'
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8a8568]"
        />
        <button
          onClick={() => onStart(prompt)}
          className="shrink-0 rounded-xl bg-[#4A4E3C] px-4 py-2 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
        >
          Start →
        </button>
      </div>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {templates.map((t, i) => (
          <motion.button
            key={t.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.03 }}
            whileHover={{ y: -2 }}
            onClick={() => onStart(t.prompt)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
              favored.includes(t.key)
                ? "border-[#4A4E3C]/40 bg-[#c2b280] text-[#4A4E3C]"
                : "border-[#D4D6C0] bg-[#F6F0E8] text-[#656952] hover:border-[#C4C8AE]"
            }`}
          >
            <span>{t.emoji}</span> {t.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  emoji,
  delay,
}: {
  label: string;
  value: number;
  emoji: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-5"
    >
      <div className="text-xl">{emoji}</div>
      <div className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.5px] text-[#4A4E3C]">
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 text-xs text-[#8a8568]">{label}</div>
    </motion.div>
  );
}

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [mv, value]);
  return <>{display}</>;
}

function EventCard({ event, delay }: { event: EventRow; delay: number }) {
  const pct = PROGRESS[event.status] ?? 10;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/events/${event.id}`}
        className="block rounded-2xl border border-[#D4D6C0] bg-[#F6F0E8] p-5 transition-shadow hover:shadow-[0px_16px_40px_-20px_rgba(74,78,60,0.3)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.3px] text-[#4A4E3C]">
            {event.title}
          </h3>
          <StatusChip status={event.status} />
        </div>
        <p className="mt-1 text-xs text-[#8a8568]">
          {[event.location, event.guest_count && `${event.guest_count} guests`, event.event_date]
            .filter(Boolean)
            .join(" · ") || "Details pending"}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ece8db]">
          <motion.div
            className="h-full rounded-full bg-[#4A4E3C]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-dashed border-[#C4C8AE] bg-[#F6F0E8]/60 p-12 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 12, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-4xl"
      >
        💍
      </motion.div>
      <p className="mt-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#4A4E3C]">
        Let&apos;s plan your wedding
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#7A8066]">
        Pick a template above or tell Ava about your wedding — she
        takes it from there.
      </p>
      <button
        onClick={onStart}
        className="mt-6 rounded-full bg-[#4A4E3C] px-6 py-3 text-sm font-medium text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] transition hover:bg-[#575B47]"
      >
        Start planning
      </button>
    </motion.div>
  );
}
