import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Marquee } from "./Marquee";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { ValueBand } from "./ValueBand";
import { FinalCTA } from "./FinalCTA";

export function Landing() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-[#f4f1e8] text-[#3d2b23]">
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <ValueBand />
      <FinalCTA />
      <footer className="border-t border-[#e5e0cf] bg-[#fdfbf4]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-xs text-[#9a8a77] sm:flex-row">
          <span className="flex items-center gap-2 font-[family-name:var(--font-fraunces)] text-base font-semibold text-[#ac5239]">
            <span>🎉</span> kalas
          </span>
          <span>Designed with ro · © {new Date().getFullYear()} Kalas</span>
        </div>
      </footer>
    </main>
  );
}
