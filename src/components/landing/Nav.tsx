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
            ? "border border-stone-200 bg-white/80 shadow-[0_8px_30px_rgba(40,38,34,0.06)] backdrop-blur-xl"
            : "border border-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="text-xl">🎉</span> kalas
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-stone-600 transition hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50"
          >
            <span className="relative z-10">Get started</span>
            <span className="absolute inset-0 -translate-x-full bg-[#7c8a76] transition-transform duration-300 group-hover:translate-x-0" />
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
