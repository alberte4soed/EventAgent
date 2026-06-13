"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const BETA_BASE = 142;

function nextTickDelay() {
  const roll = Math.random();
  if (roll < 0.12) return 3200 + Math.random() * 2800;
  if (roll < 0.35) return 6000 + Math.random() * 5000;
  return 9000 + Math.random() * 11000;
}

export function BetaUserCounter() {
  const [count, setCount] = useState(BETA_BASE - 6);
  const [display, setDisplay] = useState(BETA_BASE - 6);

  useEffect(() => {
    const target = BETA_BASE;
    const start = BETA_BASE - 6;
    const duration = 900;
    const t0 = performance.now();
    let raf = 0;

    const ramp = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (target - start) * eased);
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(ramp);
      else setCount(target);
    };

    raf = requestAnimationFrame(ramp);

    let tick: ReturnType<typeof setTimeout> | null = null;

    const scheduleTick = () => {
      tick = setTimeout(() => {
        setCount((n) => {
          const next = n + 1;
          setDisplay(next);
          return next;
        });
        scheduleTick();
      }, nextTickDelay());
    };

    const kickoff = setTimeout(scheduleTick, duration + 2500 + Math.random() * 3500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(kickoff);
      if (tick) clearTimeout(tick);
    };
  }, []);

  return (
    <p className="flex items-center justify-center gap-2.5 text-[11px] font-medium uppercase tracking-[1.5px] text-accent">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34c759] opacity-50" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34c759]" />
      </span>
      <span className="normal-case tracking-normal text-ink-muted">
        Join{" "}
        <motion.span
          key={display}
          initial={{ y: 3, filter: "blur(2px)" }}
          animate={{ y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-block min-w-[2.5ch] text-center font-semibold tabular-nums text-ink"
          aria-live="polite"
        >
          {display}
        </motion.span>{" "}
        beta couples
      </span>
    </p>
  );
}
