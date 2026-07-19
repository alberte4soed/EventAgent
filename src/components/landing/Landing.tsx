import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { IntroducingAva } from "./IntroducingAva";
import { VenueLoop } from "./VenueLoop";
import { WhatAvaRuns } from "./WhatAvaRuns";
import { FinalCTA } from "./FinalCTA";
import { LandingFooter } from "./LandingFooter";

/* Narrative order: the dream (hero + venues) → meet the planner (orb) →
   the venue loop (brief → outreach in their language → quotes) → everything
   else she runs → get started free. */
export function Landing() {
  return (
    <main className="flex flex-1 flex-col bg-cream text-ink">
      <Nav />
      <Hero />
      <Marquee />
      <IntroducingAva />
      <VenueLoop />
      <WhatAvaRuns />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
