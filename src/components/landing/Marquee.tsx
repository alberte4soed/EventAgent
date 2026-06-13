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
    <section className="border-y border-[#e5e0cf] bg-[#fdfbf4] py-5">
      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex shrink-0 gap-3 pr-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {row.map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-[#e5e0cf] bg-[#f4f1e8] px-5 py-2 text-sm font-medium text-[#5c4a3d]"
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
