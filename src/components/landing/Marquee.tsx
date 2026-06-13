"use client";

import { motion } from "framer-motion";

const items = [
  "Birthdays 🎂",
  "Weddings 💍",
  "Launch parties 🚀",
  "Anniversaries 🥂",
  "Team offsites 🌿",
  "Baby showers 🍼",
  "Graduations 🎓",
  "Dinners for 80 🍽️",
  "Reunions ✨",
];

export function Marquee() {
  const row = [...items, ...items];
  return (
    <section className="border-y border-stone-200 bg-white py-5">
      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex shrink-0 gap-3 pr-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {row.map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-stone-200 bg-[#faf9f6] px-5 py-2 text-sm font-medium text-stone-600"
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
