"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Step = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
};

const steps: Step[] = [
  {
    key: "venue",
    eyebrow: "01 · Find the venue",
    title: "Start with the venue",
    body: "Describe your wedding in plain words. Ava searches the live web for real venues that fit your guest count, city and budget — and lays them out as cards you can swipe.",
    accent: "#c2b280",
  },
  {
    key: "catering",
    eyebrow: "02 · Sort the catering",
    title: "Get the catering",
    body: "Once the venue is locked, Ava lines up caterers that match your headcount and taste — menus, dietary needs and per-head pricing compared side by side.",
    accent: "#ddd6c0",
  },
  {
    key: "event",
    eyebrow: "03 · Lock the details",
    title: "Create the event",
    body: "Ceremony time, reception schedule, headcount and run-of-show come together in one place. Ava keeps every moving piece aligned so nothing slips through the cracks.",
    accent: "#cfc8ae",
  },
  {
    key: "invites",
    eyebrow: "04 · Design the invites",
    title: "Create the invitations",
    body: "Ava designs beautiful wedding invitations matched to your style and gets them ready to order — no design tools, no copy-paste.",
    accent: "#c5bea6",
  },
  {
    key: "rsvps",
    eyebrow: "05 · Track the RSVPs",
    title: "Send out the RSVPs",
    body: "Invites go out, replies roll in. Track who's coming in real time, chase the maybes automatically, and keep a live headcount the venue can count on.",
    accent: "#c2b280",
  },
];

function StepVisual({ step }: { step: Step }) {
  switch (step.key) {
    case "venue":
      return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-[#DFE0CC]">
          <Image
            src="/process/venue-search.png"
            alt="Describe your wedding in plain words — Ava searches the live web and surfaces venue cards to swipe"
            width={960}
            height={540}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
      );
    case "catering":
      return (
        <div className="flex flex-col gap-3">
          <div className="relative h-32 w-full overflow-hidden rounded-2xl">
            <Image src="/marquee/dinners.png" alt="Catering" fill className="object-cover" sizes="420px" />
          </div>
          {[
            { name: "Nordic Table", price: "DKK 520 / head", note: "Seasonal · vegan options" },
            { name: "Botanik Kitchen", price: "DKK 480 / head", note: "Plated dinner · gluten-free" },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-xl border border-[#D4D6C0] bg-white/70 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[#4A4E3C]">{c.name}</p>
                <p className="text-[11px] text-[#7A8066]">{c.note}</p>
              </div>
              <span className="text-xs font-semibold text-[#4A4E3C]">{c.price}</span>
            </div>
          ))}
        </div>
      );
    case "event":
      return (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-[#D4D6C0] bg-white/70 p-5">
            <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#4A4E3C]">
              Emma &amp; James · Copenhagen
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Date", "Sat 14 Jun"],
                ["Guests", "120 people"],
                ["Venue", "Botanik"],
                ["Budget", "~DKK 180,000"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-[#F6F0E8] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-[#7A8066]">{k}</p>
                  <p className="font-semibold text-[#4A4E3C]">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case "invites":
      return (
        <div className="rounded-2xl border border-[#D4D6C0] bg-gradient-to-br from-[#c2b280] to-[#ddd6c0] p-6 text-center">
          <p className="text-[11px] uppercase tracking-[2px] text-[#4A4E3C]/70">You&apos;re invited</p>
          <p className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#4A4E3C]">
            Emma &amp; James
          </p>
          <p className="mt-2 text-sm text-[#4A4E3C]/80">
            Saturday 14 June · 3:00 PM
            <br />
            Botanik, Copenhagen
          </p>
          <div className="mt-5 inline-flex rounded-full bg-[#4A4E3C] px-5 py-2 text-xs font-medium text-[#F6F0E8]">
            RSVP
          </div>
        </div>
      );
    case "rsvps":
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-2xl border border-[#D4D6C0] bg-white/70 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#7A8066]">Live headcount</p>
              <p className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-[#4A4E3C]">
                94 <span className="text-base text-[#7A8066]">/ 120</span>
              </p>
            </div>
            <div className="flex -space-x-2">
              {["#c2b280", "#8a8568", "#cfc8ae", "#4A4E3C"].map((c, i) => (
                <span
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-white"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {[
            { label: "Coming", value: "94", tint: "#c2b280" },
            { label: "Maybe", value: "14", tint: "#ddd6c0" },
            { label: "Can't make it", value: "8", tint: "#F6F0E8" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-xl px-4 py-2.5" style={{ backgroundColor: r.tint }}>
              <span className="text-sm font-medium text-[#4A4E3C]">{r.label}</span>
              <span className="text-sm font-semibold text-[#4A4E3C]">{r.value}</span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function ProcessJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    setActive(Math.max(0, idx));
  });

  return (
    <section ref={sectionRef} id="features" className="relative bg-cream">
      <div className="mx-auto max-w-6xl px-6 pt-24 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
          One agent, your whole wedding
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
          From first venue to last RSVP — <span className="text-accent">handled.</span>
        </h2>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-2">
        {/* Sticky visual */}
        <div className="hidden lg:block">
          <div className="sticky top-0 flex h-screen items-center">
            <div className="w-full">
              <div className="mb-5 flex gap-2">
                {steps.map((s, i) => (
                  <span
                    key={s.key}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      i <= active ? "bg-[#4A4E3C]" : "bg-[#D4D6C0]"
                    )}
                  />
                ))}
              </div>
              <motion.div
                className={cn(
                  "rounded-[1.75rem] border border-[#D4D6C0] bg-[#F6F0E8] shadow-[0_24px_64px_-24px_rgba(74,78,60,0.3)]",
                  steps[active].key === "venue" ? "overflow-hidden p-0" : "p-5"
                )}
                style={{ borderColor: steps[active].accent }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={steps[active].key}
                    initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <StepVisual step={steps[active]} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scrolling steps */}
        <div className="py-16 lg:py-0">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className="flex min-h-[60vh] flex-col justify-center lg:min-h-screen"
            >
              {/* Mobile visual */}
              <div className="mb-6 lg:hidden">
                <div
                  className={cn(
                    "overflow-hidden rounded-[1.5rem] border bg-[#F6F0E8]",
                    s.key === "venue" ? "p-0" : "p-4"
                  )}
                  style={{ borderColor: s.accent }}
                >
                  <StepVisual step={s} />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30% 0px -30% 0px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "transition-opacity duration-300",
                  i === active ? "lg:opacity-100" : "lg:opacity-40"
                )}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-[#4A4E3C]"
                  style={{ backgroundColor: s.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
                  {s.eyebrow}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.5px] text-[#4A4E3C] sm:text-4xl">
                  {s.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-[#7A8066]">
                  {s.body}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
