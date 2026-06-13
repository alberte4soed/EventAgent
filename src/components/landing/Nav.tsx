"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto mt-3 flex w-[min(64rem,calc(100%-1.5rem))] items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300 ${
          scrolled
            ? "border border-[#e5e0cf] bg-[#fdfbf4]/80 shadow-[0_8px_30px_rgba(61,43,35,0.06)] backdrop-blur-xl"
            : "border border-transparent"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.5px] text-[#ac5239]"
        >
          <span>🎉</span> kalas
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-[#5c4a3d] transition hover:text-[#3d2b23]"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-full bg-[#ac5239] px-4 py-2 text-sm font-medium text-[#f8f4e9]"
          >
            <span className="relative z-10">Get started</span>
            <span className="absolute inset-0 -translate-x-full bg-[#3d2b23] transition-transform duration-300 group-hover:translate-x-0" />
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
