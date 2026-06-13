"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { EventRow, EventStatus, ProfileRow } from "@/lib/db/types";
import { EVENT_TEMPLATES } from "@/lib/db/profile";
import { StatusChip } from "@/components/ui/StatusChip";

interface Props {
  profile: ProfileRow;
  events: EventRow[];
  stats: { venuesLiked: number; quotesIn: number; emailsSent: number };
  gmailConnected: boolean;
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

export function HomeDashboard({ profile, events, stats, gmailConnected }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const firstName = (profile.display_name ?? "").split(" ")[0] || "there";

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
    <main className="min-h-screen bg-[#f4f1e8] text-[#3d2b23]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e5e0cf] bg-[#f4f1e8]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/home"
            className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#ac5239]"
          >
            kalas
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/events" className="rounded-full px-3.5 py-2 text-sm text-[#5c4a3d] transition hover:bg-[#ece8db]">
              Events
            </Link>
            <Link href="/settings" className="rounded-full px-3.5 py-2 text-sm text-[#5c4a3d] transition hover:bg-[#ece8db]">
              Settings
            </Link>
            <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#dfd9c6] bg-[#fdfbf4] text-lg">
              {profile.accent}
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.9px] sm:text-5xl">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-[15px] text-[#7a6b5c]">
            What are we celebrating{profile.home_city ? ` in ${profile.home_city}` : ""}?
          </p>
        </motion.div>

        {/* Quick-start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-7 rounded-3xl border border-[#dfd9c6] bg-[#fdfbf4] p-5 shadow-[0px_4px_20px_rgba(61,43,35,0.05)]"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-[#e5e0cf] bg-[#f4f1e8] px-4 py-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start(prompt)}
              placeholder="Describe your event — “50th birthday in Copenhagen for 80 people”"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a8a77]"
            />
            <button
              onClick={() => start(prompt)}
              className="shrink-0 rounded-xl bg-[#ac5239] px-4 py-2 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f]"
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
                onClick={() => start(t.prompt)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
                  favored.includes(t.key)
                    ? "border-[#ac5239]/40 bg-[#f0e4dd] text-[#ac5239]"
                    : "border-[#dfd9c6] bg-[#fdfbf4] text-[#5c4a3d] hover:border-[#cfc8b2]"
                }`}
              >
                <span>{t.emoji}</span> {t.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Gmail nudge */}
        {!gmailConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e6c4bc] bg-[#f7ebe5] px-5 py-3.5"
          >
            <p className="text-sm text-[#a8483a]">
              Connect Gmail so Kalas can email venues and gather quotes for you.
            </p>
            <Link
              href="/settings"
              className="shrink-0 rounded-full bg-[#ac5239] px-4 py-2 text-xs font-medium text-[#f8f4e9] transition hover:bg-[#96462f]"
            >
              Connect Gmail
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Stat label="Events planned" value={events.length} emoji="🗓️" delay={0.15} />
          <Stat label="Venues liked" value={stats.venuesLiked} emoji="❤️" delay={0.22} />
          <Stat label="Quotes in" value={stats.quotesIn} emoji="📊" delay={0.29} />
        </div>

        {/* Active events */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px]">
              {active.length > 0 ? "In progress" : "Your events"}
            </h2>
            {events.length > 0 && (
              <Link href="/events" className="text-sm text-[#7a6b5c] hover:text-[#3d2b23]">
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
              <h3 className="mb-4 mt-10 text-sm font-medium uppercase tracking-[1px] text-[#9a8a77]">
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
      </div>
    </main>
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
      className="rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] p-5"
    >
      <div className="text-xl">{emoji}</div>
      <div className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.5px] text-[#3d2b23]">
        <CountUp value={value} />
      </div>
      <div className="mt-0.5 text-xs text-[#9a8a77]">{label}</div>
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
        className="block rounded-2xl border border-[#dfd9c6] bg-[#fdfbf4] p-5 transition-shadow hover:shadow-[0px_16px_40px_-20px_rgba(61,43,35,0.3)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.3px] text-[#3d2b23]">
            {event.title}
          </h3>
          <StatusChip status={event.status} />
        </div>
        <p className="mt-1 text-xs text-[#9a8a77]">
          {[event.location, event.guest_count && `${event.guest_count} guests`, event.event_date]
            .filter(Boolean)
            .join(" · ") || "Details pending"}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ece8db]">
          <motion.div
            className="h-full rounded-full bg-[#ac5239]"
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
      className="rounded-3xl border border-dashed border-[#cfc8b2] bg-[#fdfbf4]/60 p-12 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 12, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="text-4xl"
      >
        🎉
      </motion.div>
      <p className="mt-4 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-[#3d2b23]">
        Let&apos;s plan your first event
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#7a6b5c]">
        Pick a template above or just tell Kalas what you&apos;re celebrating — it
        takes it from there.
      </p>
      <button
        onClick={onStart}
        className="mt-6 rounded-full bg-[#ac5239] px-6 py-3 text-sm font-medium text-[#f8f4e9] shadow-[0px_3px_10px_rgba(172,82,57,0.3)] transition hover:bg-[#96462f]"
      >
        Start planning
      </button>
    </motion.div>
  );
}
