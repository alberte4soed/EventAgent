"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PlannedVisualProps = {
  /** Path under /public — drop the file here when ready */
  src: string;
  alt: string;
  label: string;
  className?: string;
  aspect?: "video" | "square" | "portrait";
};

const aspectClass = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function PlannedVisual({
  src,
  alt,
  label,
  className,
  aspect = "video",
}: PlannedVisualProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-[#F0EBE3]",
        aspectClass[aspect],
        className
      )}
    >
      {!failed && (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F6F0E8] text-lg text-[#AEB080]">
            ◻
          </div>
          <p className="max-w-[16rem] text-sm font-medium leading-snug text-ink">{label}</p>
          <p className="max-w-full truncate font-mono text-[10px] text-accent">{src}</p>
        </div>
      )}
    </div>
  );
}
