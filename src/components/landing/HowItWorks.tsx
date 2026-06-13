"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Tell it the plan",
    body: "“A 50th birthday in Copenhagen for 80 people, budget around 40k.” That's the whole brief.",
  },
  {
    n: "02",
    title: "Swipe the options",
    body: "Real venues arrive as cards with photos. Swipe right to shortlist, left to skip — like dating, but for party spots.",
  },
  {
    n: "03",
    title: "Let it negotiate",
    body: "Kalas emails your favourites, gathers quotes, and lays them out so the best deal is impossible to miss.",
  },
  {
    n: "04",
    title: "Invite & relax",
    body: "Pick the winner, send the invites, watch the RSVPs roll in. You just decide what to wear.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[#fdfbf4]">
      <div className="mx-auto w-full max-w-5xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#ac5239]">
            From idea to invitation
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#3d2b23] sm:text-5xl">
            Four steps. Mostly yours to skip.
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Vertical line */}
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-[#e5e0cf] sm:left-1/2" />
          <div className="space-y-12">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
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
                  className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#e5e0cf] bg-[#f4f1e8] font-[family-name:var(--font-fraunces)] text-sm font-semibold text-[#ac5239] sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                >
                  {s.n}
                </motion.div>
                <div>
                  <h3 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px] text-[#3d2b23]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#7a6b5c]">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
