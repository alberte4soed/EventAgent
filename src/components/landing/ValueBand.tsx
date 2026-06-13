"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "12+", label: "venues found per search" },
  { value: "1 email", label: "from you — it sends the rest" },
  { value: "0", label: "spreadsheets, calls or chasing" },
];

export function ValueBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[#7c8a76] px-8 py-14 text-center text-white">
        {/* playful floating dots */}
        {[..."✶✦✶✦✶"].map((c, i) => (
          <motion.span
            key={i}
            className="absolute select-none text-white/30"
            style={{ left: `${12 + i * 18}%`, top: i % 2 ? "18%" : "64%", fontSize: 28 }}
            animate={{ y: [0, -14, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {c}
          </motion.span>
        ))}
        <h2 className="relative text-3xl font-medium tracking-tight sm:text-4xl">
          Best bang for your buck.
          <br className="hidden sm:block" /> Without lifting a finger.
        </h2>
        <div className="relative mt-12 grid gap-8 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm text-white/80">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
