"use client";

import type { EventRow } from "@/lib/db/types";
import { computeJourney, type JourneyExtras } from "@/lib/journey";
import { JourneyStageCard } from "./JourneyStageCard";

interface Props {
  event: EventRow;
  extras: JourneyExtras;
}

export function JourneyTimeline({ event, extras }: Props) {
  const stages = computeJourney(event, extras);
  const completed = stages.filter((s) => s.status === "complete").length;

  return (
    <section className="mt-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-[-0.4px] text-[#4A4E3C]">
          Your journey
        </h2>
        <span className="text-xs font-medium text-[#8a8568]">
          {completed} of {stages.length} done
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage, i) => (
          <JourneyStageCard key={stage.key} stage={stage} eventId={event.id} index={i} />
        ))}
      </div>
    </section>
  );
}
