"use client";

import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";

const steps = [
  {
    n: "01",
    title: "Tell it the vision",
    body: "“A garden wedding in Copenhagen for 120 guests, budget around 180k.” That's the whole brief.",
  },
  {
    n: "02",
    title: "Swipe the venues",
    body: "Real wedding venues arrive as cards with photos. Swipe right to shortlist, left to skip — like dating, but for your big day.",
  },
  {
    n: "03",
    title: "Let it negotiate",
    body: "Ava emails your favourites, gathers quotes, and lays them out so the best fit is impossible to miss.",
  },
  {
    n: "04",
    title: "Invite & relax",
    body: "Pick the winner, send the invites, watch the RSVPs roll in. You just decide what to wear.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#F6F0E8]">
      <div className="mx-auto w-full max-w-5xl px-6 py-24">
        <BlurFade inView className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
            From venue to invitation
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
            Four steps. Mostly yours to skip.
          </h2>
        </BlurFade>

        <div className="relative mt-16">
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-[#D4D6C0] sm:left-1/2" />
          <div className="space-y-12">
            {steps.map((s, i) => (
              <BlurFade
                key={s.n}
                inView
                delay={i * 0.08}
                duration={0.55}
                className={`relative flex items-start gap-6 sm:w-1/2 ${
                  i % 2 === 0
                    ? "sm:pr-12 sm:text-right"
                    : "sm:ml-auto sm:flex-row-reverse sm:pl-12 sm:text-left"
                }`}
              >
                <motion.div
                  whileInView={{ scale: [0.6, 1.15, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D4D6C0] bg-[#F6F0E8] font-[family-name:var(--font-fraunces)] text-sm font-semibold text-[#4A4E3C] sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                >
                  {s.n}
                </motion.div>
                <div>
                  <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px] text-[#4A4E3C]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#7A8066]">{s.body}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
