import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { ValueBand } from "./ValueBand";
import { FinalCTA } from "./FinalCTA";

export function Landing() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-[#faf9f6] text-stone-900">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <ValueBand />
      <FinalCTA />
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-xs text-stone-400 sm:flex-row">
          <span className="flex items-center gap-2 font-medium tracking-tight text-stone-500">
            <span>🎉</span> kalas
          </span>
          <span>Designed with ro · © {new Date().getFullYear()} Kalas</span>
        </div>
      </footer>
    </main>
  );
}
