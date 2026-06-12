"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { VenueRow } from "@/lib/db/types";

interface Props {
  messageId: string;
  venues: VenueRow[];
  onSwipe: (venueId: string, decision: "liked" | "rejected") => void;
  onFinished: (messageId: string, liked: number, rejected: number) => void;
}

const SWIPE_THRESHOLD = 110;

export function FeaturedVenueDeck({ messageId, venues, onSwipe, onFinished }: Props) {
  const pending = venues.filter((v) => v.swipe_status === "pending");
  const liked = venues.filter((v) => v.swipe_status === "liked").length;
  const rejected = venues.filter((v) => v.swipe_status === "rejected").length;
  const finishedRef = useRef(false);
  const currentIndex = venues.length - pending.length + 1;

  useEffect(() => {
    if (venues.length > 0 && pending.length === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinished(messageId, liked, rejected);
    }
  }, [pending.length, venues.length, liked, rejected, messageId, onFinished]);

  if (pending.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-3xl border border-[#dfd9c6] bg-[#fdfbf4] p-8 text-center">
        <div>
          <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-[#3d2b23]">
            All venues reviewed
          </p>
          <p className="mt-2 text-sm text-[#7a6b5c]">
            {liked} liked · {rejected} passed — ask kalas to draft your quote email.
          </p>
        </div>
      </div>
    );
  }

  const top = pending[0];

  return (
    <div className="flex h-full select-none flex-col">
      <div className="relative min-h-[480px] flex-1">
        <AnimatePresence>
          <FeaturedCard
            key={top.id}
            venue={top}
            index={currentIndex}
            total={venues.length}
            onDecide={(d) => onSwipe(top.id, d)}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

function FeaturedCard({
  venue,
  index,
  total,
  onDecide,
}: {
  venue: VenueRow;
  index: number;
  total: number;
  onDecide: (decision: "liked" | "rejected") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  const [exitX, setExitX] = useState(0);

  const chips = [venue.capacity && `${venue.capacity}`, venue.price_hint].filter(
    Boolean
  ) as string[];

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) {
          setExitX(500);
          onDecide("liked");
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
          setExitX(-500);
          onDecide("rejected");
        }
      }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.25 } }}
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute left-6 top-6 z-10 rotate-[-8deg] rounded-md border-2 border-[#ac5239] px-3 py-1 text-lg font-bold text-[#ac5239]"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute right-6 top-6 z-10 rotate-[8deg] rounded-md border-2 border-[#7a6b5c] px-3 py-1 text-lg font-bold text-[#7a6b5c]"
      >
        PASS
      </motion.div>

      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#dfd9c6] bg-[#fdfbf4] shadow-[0px_4px_12px_rgba(61,43,35,0.07),0px_16px_40px_rgba(61,43,35,0.08)]">
        <div
          className={`relative h-[280px] shrink-0 bg-cover bg-center bg-no-repeat ${
            venue.image_url ? "" : "bg-gradient-to-br from-[#d4cbb8] via-[#e8e2d4] to-[#cfc8b2]"
          }`}
          style={venue.image_url ? { backgroundImage: `url('${venue.image_url}')` } : undefined}
        >
          <div className="absolute left-4 top-4 flex h-7 items-center rounded-full bg-[#ac5239] px-3">
            <span className="text-xs font-semibold text-[#f8f4e9]">On your board</span>
          </div>
          <div className="absolute right-4 top-4 flex h-6 items-center rounded-full bg-[#2218128c] px-2.5">
            <span className="text-[11.5px] font-medium text-[#f8f4e9]">
              {index} / {total}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-[22px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-[family-name:var(--font-fraunces)] text-[22px] font-semibold tracking-[-0.55px] text-[#3d2b23]">
                {venue.name}
              </h3>
              {venue.address && (
                <p className="mt-1 flex items-center gap-1 text-[13px] text-[#7a6b5c]">
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="size-[13px] shrink-0 text-[#9a8a77]"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {venue.address}
                </p>
              )}
            </div>
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDownCapture={(e) => e.stopPropagation()}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#e5e0cf] px-3 text-[12.5px] font-medium text-[#5c4a3d] transition hover:bg-[#f0ede0]"
              >
                Website
              </a>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="flex h-7 items-center rounded-full border border-[#e5e0cf] bg-[#f0ede0] px-3 text-xs font-medium text-[#5c4a3d]"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {venue.description && (
            <p className="line-clamp-3 text-[13.5px] leading-[1.6] text-[#5c4a3d]">
              {venue.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              aria-label="Pass venue"
              onClick={() => onDecide("rejected")}
              className="flex size-14 items-center justify-center rounded-full border border-[#dfd9c6] bg-[#fdfbf4] text-[#7a6b5c] shadow-[0px_2px_8px_rgba(61,43,35,0.08)] transition hover:scale-105"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="size-[22px]"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Like venue"
              onClick={() => onDecide("liked")}
              className="flex size-16 items-center justify-center rounded-full bg-[#ac5239] text-[#f8f4e9] shadow-[0px_4px_14px_rgba(172,82,57,0.35)] transition hover:scale-105"
            >
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="size-[26px]"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
