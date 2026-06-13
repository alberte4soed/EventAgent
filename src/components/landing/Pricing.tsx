"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "to begin",
    description: "Tell Ava about your wedding and start finding venues.",
    features: [
      "Venue search & shortlisting",
      "Up to 5 outreach emails",
      "Quote comparison",
      "Chat with Ava",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Complete",
    price: "DKK 499",
    period: "/ month",
    description: "Everything you need from venue to last RSVP.",
    features: [
      "Unlimited vendor outreach",
      "Budget tracking & alerts",
      "Guest list & RSVPs",
      "Wedding website",
      "Planning timeline",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "DKK 899",
    period: "/ month",
    description: "White-glove planning with priority support.",
    features: [
      "Everything in Complete",
      "Priority vendor follow-ups",
      "Seating chart & meal planning",
      "Dedicated onboarding call",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-24">
      <BlurFade inView className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
          Pricing
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
          Plans.
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#7A8066]">
          Free to start, transparent tiers, no surprises. Upgrade when you&apos;re ready to
          hand Ava the full wedding.
        </p>
      </BlurFade>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {tiers.map((tier, i) => (
          <BlurFade key={tier.name} inView delay={i * 0.08} duration={0.5}>
            <motion.div
              whileHover={{ y: -4 }}
              className={`flex h-full flex-col rounded-3xl border p-7 ${
                tier.highlighted
                  ? "border-[#4A4E3C] bg-[#4A4E3C] text-[#F6F0E8] shadow-[0_24px_64px_-24px_rgba(74,78,60,0.4)]"
                  : "border-[#D4D6C0] bg-[#F6F0E8]"
              }`}
            >
              <div>
                <p
                  className={`text-sm font-medium ${
                    tier.highlighted ? "text-rose-blush" : "text-accent"
                  }`}
                >
                  {tier.name}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.5px]">
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm ${
                      tier.highlighted ? "text-[#AEB080]" : "text-[#7A8066]"
                    }`}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    tier.highlighted ? "text-[#AEB080]" : "text-[#7A8066]"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2 text-sm ${
                      tier.highlighted ? "text-[#F6F0E8]" : "text-[#4A4E3C]"
                    }`}
                  >
                    <span className={tier.highlighted ? "text-rose-blush" : "text-accent"}>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 inline-flex justify-center rounded-full px-6 py-3 text-sm font-medium transition ${
                  tier.highlighted
                    ? "bg-blue text-on-ink hover:bg-blue-light"
                    : "bg-blue text-on-ink hover:bg-blue-light"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          </BlurFade>
        ))}
      </div>

      <BlurFade inView delay={0.2} className="mt-10 text-center">
        <Link
          href="/vendors"
          className="text-sm text-[#7A8066] underline decoration-[#D4D6C0] underline-offset-4 transition hover:text-[#4A4E3C]"
        >
          For vendors →
        </Link>
      </BlurFade>
    </section>
  );
}
