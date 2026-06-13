import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { WorksEverywhere } from "./WorksEverywhere";
import { Marquee } from "./Marquee";
import { MeetAva } from "./MeetAva";
import { HowAvaWorks } from "./HowAvaWorks";
import { Pricing } from "./Pricing";
import { FinalCTA } from "./FinalCTA";
import { LandingFooter } from "./LandingFooter";

export function Landing() {
  return (
    <main className="flex flex-1 flex-col bg-cream text-ink">
      <Nav />
      <Hero />
      <Marquee />
      <WorksEverywhere />
      <MeetAva />
      <HowAvaWorks />
      <Pricing />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
