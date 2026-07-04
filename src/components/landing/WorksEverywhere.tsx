"use client";

import * as React from "react";
import { DottedMap, type Marker } from "@/components/ui/dotted-map";
import { BlurFade } from "@/components/ui/blur-fade";
import { BetaUserCounter } from "@/components/landing/BetaUserCounter";

type CityMarker = Marker & {
  overlay: {
    countryCode: string;
    label: string;
  };
};

const markers: CityMarker[] = [
  {
    lat: 55.6761,
    lng: 12.5683,
    size: 2.2,
    pulse: true,
    overlay: { countryCode: "dk", label: "Copenhagen" },
  },
  {
    lat: 40.7128,
    lng: -74.006,
    size: 2.2,
    overlay: { countryCode: "us", label: "NYC" },
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    size: 2.2,
    overlay: { countryCode: "gb", label: "London" },
  },
  {
    lat: 37.5665,
    lng: 126.978,
    size: 2.2,
    overlay: { countryCode: "kr", label: "Seoul" },
  },
  {
    lat: 25.2048,
    lng: 55.2708,
    size: 2.2,
    overlay: { countryCode: "ae", label: "Dubai" },
  },
];

export function WorksEverywhere() {
  const id = React.useId();

  return (
    <section className="relative -mt-px bg-cream pb-12 pt-14 sm:pb-16 sm:pt-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <BlurFade inView className="mx-auto max-w-2xl text-center">
          <BetaUserCounter />
          <h2 className="mt-4 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-[-0.8px] text-[#4A4E3C] sm:text-5xl">
            Works wherever{" "}
            <span className="text-accent">you live.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#7A8066]">
            Ava searches the live web for real wedding venues in your city — then handles
            outreach, quotes and invites from wherever you are.
          </p>
        </BlurFade>
      </div>

      <BlurFade inView delay={0.12} duration={0.6} className="relative mt-12 w-full sm:mt-14">
        <div className="relative h-[440px] w-full overflow-hidden sm:h-[540px] lg:h-[620px]">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_50%,#F6F0E8_90%)]" />
          <DottedMap<CityMarker>
            width={220}
            height={110}
            markers={markers}
            dotColor="#959B82"
            markerColor="#AEB080"
            dotRadius={0.5}
            mapSamples={5200}
            pulse
            className="absolute inset-0 h-full w-full"
            renderMarkerOverlay={({ marker, x, y, r, index }) => {
              const { countryCode, label } = marker.overlay;
              const href = `https://flagcdn.com/w80/${countryCode}.webp`;

              const clipId = `${id}-flag-clip-${index}`.replace(/:/g, "-");
              const imgR = r * 0.75;

              const fontSize = r * 0.9;
              const pillH = r * 1.5;
              const pillW = label.length * (fontSize * 0.62) + r * 1.4;
              const pillX = x + r + r * 0.6;
              const pillY = y - pillH / 2;

              return (
                <g style={{ pointerEvents: "none" }}>
                  <clipPath id={clipId}>
                    <circle cx={x} cy={y} r={imgR} />
                  </clipPath>

                  <image
                    href={href}
                    x={x - imgR}
                    y={y - imgR}
                    width={imgR * 2}
                    height={imgR * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                  />

                  <rect
                    x={pillX}
                    y={pillY}
                    width={pillW}
                    height={pillH}
                    rx={pillH / 2}
                    fill="rgba(74,78,60,0.72)"
                  />
                  <text
                    x={pillX + r * 0.7}
                    y={y + fontSize * 0.35}
                    fontSize={fontSize}
                    fill="#F6F0E8"
                  >
                    {label}
                  </text>
                </g>
              );
            }}
          />
        </div>
      </BlurFade>
    </section>
  );
}
