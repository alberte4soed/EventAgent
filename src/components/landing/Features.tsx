"use client";

import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";

const features = [
  {
    emoji: "🔎",
    title: "Finds the right venues",
    body: "Describe your wedding in plain words. Ava searches the live web for real venues that fit your guest count, city and vibe — verified on Google with ratings, reviews and photos.",
    tint: "#c2b280",
  },
  {
    emoji: "✉️",
    title: "Reaches out for you",
    body: "Approve the outreach and Ava emails every venue you liked from her own concierge inbox — a personal note to each, replies tracked in one place.",
    tint: "#ddd6c0",
  },
  {
    emoji: "📊",
    title: "Compares the quotes",
    body: "Replies land as tidy, side-by-side quotes — price, availability and what's included — so the best fit is obvious at a glance.",
    tint: "#cfc8ae",
  },
  {
    emoji: "🤝",
    title: "Plans with you",
    body: "It chats through trade-offs, nudges slow venues, and helps you land on the one that's right — no spreadsheet, no phone tag.",
    tint: "#c5bea6",
  },
  {
    emoji: "💌",
    title: "Designs the invites",
    body: "Once you've picked a venue, Ava designs beautiful wedding invitations matched to your style — ready to order and send.",
    tint: "#c2b280",
  },
  {
    emoji: "✅",
    title: "Manages the RSVPs",
    body: "Track who's coming in real time, chase the maybes automatically, and keep a live headcount the venue can count on.",
    tint: "#ddd6c0",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
      <BlurFade inView className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
          One agent, your whole wedding
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
          Everything a wedding needs —{" "}
          <span className="text-accent">handled.</span>
        </h2>
      </BlurFade>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <BlurFade key={f.title} inView delay={(i % 3) * 0.1} duration={0.5}>
            <motion.div
              whileHover={{ y: -6 }}
              className="group rounded-3xl border border-[#D4D6C0] bg-[#F6F0E8] p-7 transition-shadow hover:shadow-[0_20px_50px_-24px_rgba(74,78,60,0.3)]"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ backgroundColor: f.tint }}
              >
                {f.emoji}
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.3px] text-[#4A4E3C]">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#7A8066]">{f.body}</p>
            </motion.div>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
