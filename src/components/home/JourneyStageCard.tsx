"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { JourneyStage } from "@/lib/journey";
import { CATEGORY_META, HUB_VENDOR_CATEGORIES } from "@/lib/journey";

interface Props {
  stage: JourneyStage;
  eventId: string;
  index: number;
}

export function JourneyStageCard({ stage, eventId, index }: Props) {
  const locked = stage.status === "locked";
  const complete = stage.status === "complete";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + index * 0.06 }}
      className={`relative flex flex-col rounded-2xl border p-5 transition ${
        locked
          ? "border-[#D4D6C0] bg-[#F6F0E8]/50 opacity-60"
          : complete
            ? "border-[#C4C8AE] bg-[#ece8db]"
            : "border-[#4A4E3C]/30 bg-[#F6F0E8] shadow-[0px_4px_20px_rgba(74,78,60,0.08)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{stage.emoji}</span>
        {complete && (
          <span className="flex size-6 items-center justify-center rounded-full bg-[#4A4E3C]">
            <svg stroke="#F6F0E8" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="size-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {locked && (
          <svg stroke="#8a8568" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="size-4">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-[-0.35px] text-[#4A4E3C]">
        {stage.label}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[#7A8066]">{stage.hint}</p>

      {stage.key === "vendors" && stage.status === "active" ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {HUB_VENDOR_CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            return (
              <Link
                key={c}
                href={`/events/${eventId}?prompt=${encodeURIComponent(meta.prompt)}`}
                className="flex items-center gap-1 rounded-full border border-[#D4D6C0] bg-[#F6F0E8] px-2.5 py-1.5 text-[11.5px] font-medium text-[#656952] transition hover:border-[#4A4E3C] hover:bg-[#c2b280] hover:text-[#4A4E3C]"
              >
                <span>{meta.emoji}</span> {meta.label}
              </Link>
            );
          })}
        </div>
      ) : (
        !locked && (
          <Link
            href={stage.href}
            className={`mt-4 inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-medium transition ${
              complete
                ? "border border-[#4A4E3C]/30 text-[#4A4E3C] hover:bg-[#c2b280]"
                : "bg-[#4A4E3C] text-[#F6F0E8] shadow-[0px_3px_10px_rgba(74,78,60,0.3)] hover:bg-[#575B47]"
            }`}
          >
            {stage.cta} →
          </Link>
        )
      )}
    </motion.div>
  );
}
