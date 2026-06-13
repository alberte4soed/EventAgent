"use client";

import { motion } from "framer-motion";

const features = [
  {
    emoji: "🔎",
    title: "Finds the right places",
    body: "Describe your event in plain words. Kalas searches the live web for real venues that fit your size, city and vibe — with photos, not just links.",
    tint: "#e8efe3",
  },
  {
    emoji: "✉️",
    title: "Reaches out for you",
    body: "Approve one message and it emails every venue you liked from your own Gmail — personalised, polite, and signed by you.",
    tint: "#f3e2d6",
  },
  {
    emoji: "📊",
    title: "Compares the quotes",
    body: "Replies land as tidy, side-by-side quotes — price, availability and what's included — so the best value is obvious at a glance.",
    tint: "#e7ecf1",
  },
  {
    emoji: "🤝",
    title: "Coordinates with you",
    body: "It chats through trade-offs, nudges slow venues, and helps you land on the one that's right — no spreadsheet, no phone tag.",
    tint: "#f1e6ef",
  },
  {
    emoji: "💌",
    title: "Designs the invites",
    body: "Once you've picked a place, Kalas drafts beautiful invitations matched to your event and sends them to your guest list.",
    tint: "#f3ecd6",
  },
  {
    emoji: "✅",
    title: "Manages the RSVPs",
    body: "Track who's coming in real time, chase the maybes automatically, and keep a live headcount the venue can count on.",
    tint: "#e3ece8",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#7c8a76]">
          One agent, the whole party
        </p>
        <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Everything an event needs —{" "}
          <span className="text-stone-300">handled.</span>
        </h2>
      </motion.div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            whileHover={{ y: -6 }}
            className="group rounded-3xl border border-stone-200 bg-white p-7 transition-shadow hover:shadow-[0_20px_50px_-24px_rgba(40,38,34,0.3)]"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ backgroundColor: f.tint }}
            >
              {f.emoji}
            </div>
            <h3 className="mt-5 text-lg font-medium tracking-tight">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
