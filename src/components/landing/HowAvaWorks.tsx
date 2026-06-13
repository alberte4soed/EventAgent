"use client";

import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import { PlannedVisual } from "./PlannedVisual";

const steps = [
  {
    n: "01",
    icon: "💬",
    title: "Tell her about your wedding",
    body: "Guest count, vibe, city, budget — the whole brief in plain words.",
  },
  {
    n: "02",
    icon: "⚙️",
    title: "She works in the background",
    body: "Ava searches, drafts, follows up, and organizes — while you get on with life.",
  },
  {
    n: "03",
    icon: "📋",
    title: "She comes back with things to approve",
    body: "Shortlists, drafted emails, quote comparisons — queued up and ready for your review.",
  },
  {
    n: "04",
    icon: "✓",
    title: "You decide, she executes",
    body: "Approve what you like. Ava sends, books, updates, and moves to the next item.",
  },
];

export function HowAvaWorks() {
  return (
    <section id="how-it-works" className="bg-[#F6F0E8]">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <BlurFade inView className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
            How it works
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
            How Ava works.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#7A8066]">
            Four steps — tell her about your wedding, she works in the background, she comes
            back with things to approve, you decide and she executes. She works; you decide.
          </p>
        </BlurFade>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <BlurFade key={s.n} inView delay={i * 0.08} duration={0.5}>
              <motion.div
                whileHover={{ y: -4 }}
                className="flex h-full flex-col rounded-3xl border border-[#D4D6C0] bg-cream p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue text-lg">
                    {s.icon}
                  </span>
                  <span className="font-[family-name:var(--font-fraunces)] text-sm font-semibold text-accent">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.3px] text-[#4A4E3C]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#7A8066]">{s.body}</p>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </div>

      <div className="border-t border-[#D4D6C0] bg-cream">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
          <BlurFade inView className="max-w-lg">
            <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
              You&apos;re always in control
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
              Ava does it. You oversee it.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#7A8066]">
              Nothing happens without you. On your phone or your desk, Ava queues up everything
              she&apos;s prepared — drafted emails, quotes to compare, suggestions ready to go —
              and waits for your go-ahead. Open the app on your lunch break, clear her
              suggestions in five minutes, and get on with your day.
            </p>
          </BlurFade>

          <BlurFade inView delay={0.1} duration={0.6}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] sm:items-end">
              <PlannedVisual
                src="/ava/approval-queue-mobile.png"
                alt="Approval queue on mobile"
                label="Mobile · approval queue"
                aspect="portrait"
                className="mx-auto w-full max-w-[180px] sm:mx-0"
              />
              <PlannedVisual
                src="/ava/approval-queue-desktop.png"
                alt="Approval queue on desktop"
                label="Desktop · approval queue"
              />
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
