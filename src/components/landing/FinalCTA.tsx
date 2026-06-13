"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[#f3e2d6] blur-[110px]" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-[#e8efe3] blur-[110px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.div
          animate={{ rotate: [0, 14, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto mb-6 text-5xl"
        >
          🎉
        </motion.div>
        <h2 className="text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
          Your next celebration,
          <br />
          <span className="text-[#7c8a76]">basically planned already.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-stone-500">
          Sign in with Google and tell Kalas what you&apos;re celebrating. The first
          quotes can be in your inbox today.
        </p>
        <Link
          href="/login"
          className="group relative mt-10 inline-flex overflow-hidden rounded-full bg-stone-900 px-10 py-4 text-sm font-medium text-stone-50"
        >
          <span className="relative z-10">Start planning — it&apos;s free</span>
          <span className="absolute inset-0 -translate-x-full bg-[#7c8a76] transition-transform duration-300 group-hover:translate-x-0" />
        </Link>
      </motion.div>
    </section>
  );
}
