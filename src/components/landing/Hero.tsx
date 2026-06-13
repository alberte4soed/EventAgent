"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const headline = ["Throw", "the", "party.", "Skip", "the", "planning."];

// Quirky floating shapes — warm palette, playful but restrained.
const blobs = [
  { emoji: "🎈", x: "8%", y: "18%", size: 44, delay: 0, dur: 6 },
  { emoji: "✨", x: "86%", y: "12%", size: 32, delay: 0.6, dur: 5 },
  { emoji: "🥂", x: "90%", y: "62%", size: 40, delay: 1.1, dur: 7 },
  { emoji: "🎂", x: "4%", y: "68%", size: 38, delay: 0.3, dur: 6.5 },
  { emoji: "💌", x: "78%", y: "82%", size: 30, delay: 0.9, dur: 5.5 },
];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yPreview = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-36 sm:pt-44">
      {/* Soft colour wash */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#f0e4dd] blur-[120px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-[#f3ecd6] blur-[100px]" />
        <div className="absolute left-0 top-60 h-72 w-72 rounded-full bg-[#e7ecf1] blur-[100px]" />
      </div>

      {/* Floating emoji */}
      {blobs.map((b, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute hidden select-none sm:block"
          style={{ left: b.x, top: b.y, fontSize: b.size }}
          animate={{ y: [0, -18, 0], rotate: [0, 8, -6, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {b.emoji}
        </motion.span>
      ))}

      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#e5e0cf] bg-[#fdfbf4]/70 px-4 py-1.5 text-xs font-medium text-[#5c4a3d] backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[#ac5239] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ac5239]" />
          </span>
          Your fully-managed event agent
        </motion.div>

        <h1 className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold leading-[1.04] tracking-[-1px] text-[#3d2b23] sm:text-7xl">
          {headline.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 24, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`mr-[0.25em] inline-block ${word === "planning." ? "text-[#c9bda4]" : ""}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#7a6b5c]"
        >
          Tell Kalas what you&apos;re celebrating. It finds the venues, emails them
          for you, compares the quotes, designs the invites and tracks every RSVP —
          so you just show up and celebrate.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-full bg-[#ac5239] px-8 py-4 text-sm font-medium text-[#f8f4e9] shadow-[0px_4px_14px_rgba(172,82,57,0.3)]"
          >
            <span className="relative z-10">Plan my event — free</span>
            <span className="absolute inset-0 -translate-x-full bg-[#3d2b23] transition-transform duration-300 group-hover:translate-x-0" />
          </Link>
          <Link
            href="#features"
            className="rounded-full border border-[#dfd9c6] bg-[#fdfbf4]/60 px-8 py-4 text-sm font-medium text-[#5c4a3d] backdrop-blur transition hover:border-[#cfc8b2] hover:bg-[#fdfbf4]"
          >
            See how it works
          </Link>
        </motion.div>
      </div>

      {/* Floating agent preview */}
      <motion.div
        style={{ y: yPreview, opacity }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="mx-auto mt-16 max-w-md"
      >
        <HeroPreview />
      </motion.div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="rotate-[-1.5deg] rounded-3xl border border-[#dfd9c6] bg-[#fdfbf4]/80 p-4 shadow-[0_30px_80px_-20px_rgba(61,43,35,0.25)] backdrop-blur-xl">
      <div className="space-y-3">
        <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-[#ac5239] px-4 py-2.5 text-sm text-[#f8f4e9]">
          50th birthday in Copenhagen, ~80 guests 🎉
        </div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm border border-[#e5e0cf] bg-[#f8f4e9] px-4 py-2.5 text-sm text-[#5c4a3d]"
        >
          Found 8 venues that fit. Swipe through them →
        </motion.div>
        <div className="flex gap-2 pt-1">
          {["🏛️", "🌿", "🍸"].map((e, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-16 flex-1 items-center justify-center rounded-2xl border border-[#e5e0cf] bg-[#f4f1e8] text-2xl"
            >
              {e}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1 text-xs text-[#ac5239]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ac5239]" />
          Emailing your 3 favourites for quotes…
        </div>
      </div>
    </div>
  );
}
