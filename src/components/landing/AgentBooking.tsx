"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { AgentLiveFeed } from "@/components/landing/AgentLiveFeed";

export function AgentBooking() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <BlurFade inView className="max-w-lg">
          <p className="text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
            While you live your life
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
            Watch Ava get you{" "}
            <span className="text-accent">booked.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#7A8066]">
            From your first message to a confirmed venue and invites in the wild —
            Ava keeps you in the loop with a live feed of everything she&apos;s
            doing behind the scenes.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-[#656952]">
            {[
              "Finds and shortlists real wedding venues",
              "Reaches out to vendors from her concierge inbox",
              "Compares quotes and recommends the best fit",
              "Designs and orders your invites once you're booked",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-[#4A4E3C]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </BlurFade>

        <BlurFade inView delay={0.15} duration={0.6}>
          <AgentLiveFeed />
        </BlurFade>
      </div>
    </section>
  );
}
