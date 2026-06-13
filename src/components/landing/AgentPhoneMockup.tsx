"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { AgentLiveFeed } from "@/components/landing/AgentLiveFeed";

interface AgentPhoneMockupProps {
  className?: string;
}

export function AgentPhoneMockup({ className }: AgentPhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-[min(100%,260px)] sm:w-[280px]", className)}>
      <div className="relative rounded-[2.75rem] bg-[#101010] p-[7px] ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[2.35rem] bg-black">
          <Image
            src="/phone-wallpaper-v3.png"
            alt=""
            fill
            className="object-cover object-top"
            sizes="300px"
            priority
          />

          <div className="relative z-10 pt-20">
            <div className="h-[420px] sm:h-[440px]">
              <AgentLiveFeed variant="phone" className="h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
