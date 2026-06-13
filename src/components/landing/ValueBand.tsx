"use client";

import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";

const stats = [
  { value: "12+", label: "venues found per search" },
  { value: "1 email", label: "from you — it sends the rest" },
  { value: "0", label: "spreadsheets, calls or venue chasing" },
];

export function ValueBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <BlurFade inView duration={0.6}>
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/40 bg-blue px-8 py-14 text-center text-on-ink">
          {[..."✶✦✶✦✶"].map((c, i) => (
            <motion.span
              key={i}
              className="absolute select-none text-accent/25"
              style={{ left: `${12 + i * 18}%`, top: i % 2 ? "18%" : "64%", fontSize: 28 }}
              animate={{ y: [0, -14, 0], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              {c}
            </motion.span>
          ))}
          <h2 className="relative font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.6px] sm:text-4xl">
            The venue you want.
            <br className="hidden sm:block" /> Without the planning marathon.
          </h2>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
            {stats.map((s, i) => (
              <BlurFade key={s.label} inView delay={0.15 + i * 0.12} duration={0.5}>
                <div>
                  <div className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.5px] sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm text-ink-muted">{s.label}</div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </BlurFade>
    </section>
  );
}
