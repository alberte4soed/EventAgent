"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PlannedVisual } from "./PlannedVisual";

type Capability = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  visual: {
    src: string;
    alt: string;
    label: string;
  };
};

const capabilities: Capability[] = [
  {
    key: "meet",
    eyebrow: "Meet Ava",
    title: "Meet Ava, your wedding planner.",
    body: "Tell her what you're dreaming of — \"120 guests, rustic, near Copenhagen, under 80k\" — and she gets to work. You bring the vision and make the calls; Ava does the legwork.",
    accent: "#3A4F37",
    visual: {
      src: "/ava/chat-shortlist.png",
      alt: "Chat interface mid-conversation, Ava responding with a shortlist",
      label: "Chat interface · Ava shortlisting venues",
    },
  },
  {
    key: "vendors",
    eyebrow: "She finds your vendors",
    title: "She finds the venues and vendors that fit.",
    body: "Ava searches real listings across every category — venues, caterers, photographers, florists — and surfaces the ones that match your guest count, style, location and budget.",
    accent: "#DFE0CC",
    visual: {
      src: "/ava/vendor-search.png",
      alt: "Venue and vendor cards filtered to match your wedding brief",
      label: "Vendor search · matched listings",
    },
  },
  {
    key: "outreach",
    eyebrow: "She handles the outreach",
    title: "She reaches out — so you don't email thirty people.",
    body: "Approve once, and Ava sends personalized inquiries to everyone you liked. She answers the back-and-forth, chases the vendors who go quiet, and keeps every thread organized.",
    accent: "#DCE6D4",
    visual: {
      src: "/ava/inbox-draft.png",
      alt: "Inbox thread with a drafted reply waiting for approval",
      label: "Inbox · draft reply awaiting approval",
    },
  },
  {
    key: "quotes",
    eyebrow: "She reads and compares the quotes",
    title: "She reads every reply and lays it out for you.",
    body: "As quotes come in, Ava pulls out prices, dates, and what's included, and puts them side by side so you can see how they stack up at a glance.",
    accent: "#DFE0CC",
    visual: {
      src: "/ava/quote-comparison.png",
      alt: "Quote comparison table with prices and inclusions",
      label: "Quotes · side-by-side comparison",
    },
  },
  {
    key: "budget",
    eyebrow: "She keeps you on budget",
    title: "She watches the numbers.",
    body: "The budget updates itself as Ava tracks every deposit, payment, and commitment against your total — and she flags you before anything pushes you over.",
    accent: "#3A4F37",
    visual: {
      src: "/ava/budget-dashboard.png",
      alt: "Budget dashboard with category breakdown",
      label: "Budget · category breakdown",
    },
  },
  {
    key: "guests",
    eyebrow: "She manages your guests",
    title: "She keeps your guest list current.",
    body: "Guest list, RSVPs, meal choices, and seating all live in one place, kept up to date as responses come in. Save-the-dates and invitations go out when you approve them.",
    accent: "#DFE0CC",
    visual: {
      src: "/ava/guest-list.png",
      alt: "Guest list view and seating chart",
      label: "Guests · list and seating chart",
    },
  },
  {
    key: "website",
    eyebrow: "She builds and maintains your website",
    title: "Your wedding website, always up to date.",
    body: "Ava keeps your wedding website current — details, schedule, RSVPs — without you touching it.",
    accent: "#DCE6D4",
    visual: {
      src: "/ava/wedding-website.png",
      alt: "Wedding website template on desktop and mobile",
      label: "Website · desktop and mobile preview",
    },
  },
  {
    key: "timeline",
    eyebrow: "She keeps you on schedule",
    title: "She knows what's next.",
    body: "The planning timeline runs in the background. Ava surfaces what needs your attention now — \"time to book your photographer\" — and nudges you before deadlines slip.",
    accent: "#DFE0CC",
    visual: {
      src: "/ava/timeline-reminder.png",
      alt: "Timeline checklist with an active reminder",
      label: "Timeline · active reminder",
    },
  },
];

function CapabilityVisual({ step }: { step: Capability }) {
  return (
    <PlannedVisual
      src={step.visual.src}
      alt={step.visual.alt}
      label={step.visual.label}
    />
  );
}

export function MeetAva() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const elements = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) return;

        const index = elements.indexOf(visible[0].target as HTMLDivElement);
        if (index >= 0) setActive(index);
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="relative scroll-mt-24 bg-cream">
      <div className="mx-auto w-full max-w-6xl min-w-0 px-6 pt-24 pb-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
          Meet Ava
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-ink sm:text-5xl">
          She handles the wedding.{" "}
          <span className="text-accent">You stay in charge.</span>
        </h2>
      </div>

      <div className="mx-auto w-full max-w-6xl min-w-0 px-6 pb-16 lg:pb-24">
        <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14 xl:gap-16">
          <div className="relative hidden min-w-0 lg:block">
            <div className="sticky top-24 flex h-[calc(100vh-6rem)] items-center py-6">
              <div className="w-full min-w-0">
                <div className="mb-5 flex gap-1.5">
                  {capabilities.map((s, i) => (
                    <span
                      key={s.key}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        i <= active ? "bg-ink" : "bg-border"
                      )}
                    />
                  ))}
                </div>
                <motion.div
                  className="min-w-0 overflow-hidden rounded-[1.75rem] border border-border bg-surface p-4 shadow-[0_24px_64px_-24px_rgba(74,78,60,0.3)]"
                  style={{ borderColor: capabilities[active].accent }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={capabilities[active].key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <CapabilityVisual step={capabilities[active]} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            {capabilities.map((s, i) => (
              <div
                key={s.key}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[60vh] flex-col justify-center py-10 lg:min-h-[85vh] lg:py-14"
              >
                <div className="mb-6 lg:hidden">
                  <div
                    className="min-w-0 overflow-hidden rounded-[1.5rem] border bg-surface p-3"
                    style={{ borderColor: s.accent }}
                  >
                    <CapabilityVisual step={s} />
                  </div>
                </div>

                <div
                  className={cn(
                    "min-w-0 transition-opacity duration-300",
                    i === active ? "lg:opacity-100" : "lg:opacity-35"
                  )}
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-ink"
                    style={{ backgroundColor: s.accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
                    {s.eyebrow}
                  </p>
                  <h3 className="mt-2 max-w-full font-[family-name:var(--font-fraunces)] text-3xl font-semibold tracking-[-0.5px] text-ink sm:text-4xl">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-full text-base leading-relaxed text-ink-muted">
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
