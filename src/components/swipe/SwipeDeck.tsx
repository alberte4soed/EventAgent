"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { VenueRow } from "@/lib/db/types";
import { VenueCard } from "./VenueCard";

interface Props {
  messageId: string;
  venues: VenueRow[];
  onSwipe: (venueId: string, decision: "liked" | "rejected") => void;
  onFinished: (messageId: string, liked: number, rejected: number) => void;
}

const SWIPE_THRESHOLD = 110;

export function SwipeDeck({ messageId, venues, onSwipe, onFinished }: Props) {
  const pending = venues.filter((v) => v.swipe_status === "pending");
  const liked = venues.filter((v) => v.swipe_status === "liked").length;
  const rejected = venues.filter((v) => v.swipe_status === "rejected").length;
  const finishedRef = useRef(false);

  // Announce deck completion once every card has been swiped.
  useEffect(() => {
    if (venues.length > 0 && pending.length === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinished(messageId, liked, rejected);
    }
  }, [pending.length, venues.length, liked, rejected, messageId, onFinished]);

  if (venues.length === 0) return null;

  if (pending.length === 0) {
    return (
      <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
        <span>Deck finished:</span>
        <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-emerald-300">
          {liked} liked
        </span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5">{rejected} passed</span>
      </div>
    );
  }

  const top = pending[0];

  return (
    <div className="w-full max-w-sm select-none">
      <div className="relative h-72">
        {/* Static peek of the next card underneath */}
        {pending[1] && (
          <div className="absolute inset-0 translate-y-2 scale-[0.97] opacity-50">
            <VenueCard venue={pending[1]} />
          </div>
        )}
        <AnimatePresence>
          <TopCard key={top.id} venue={top} onDecide={(d) => onSwipe(top.id, d)} />
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          aria-label="Reject venue"
          onClick={() => onSwipe(top.id, "rejected")}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-red-900 bg-red-950/60 text-xl text-red-400 transition hover:scale-105"
        >
          ✕
        </button>
        <span className="text-xs text-zinc-600">
          {venues.length - pending.length + 1} / {venues.length}
        </span>
        <button
          aria-label="Like venue"
          onClick={() => onSwipe(top.id, "liked")}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-900 bg-emerald-950/60 text-xl text-emerald-400 transition hover:scale-105"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

function TopCard({
  venue,
  onDecide,
}: {
  venue: VenueRow;
  onDecide: (decision: "liked" | "rejected") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  const [exitX, setExitX] = useState(0);

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
        className="absolute left-4 top-4 z-10 rotate-[-12deg] rounded-md border-2 border-emerald-400 px-3 py-1 text-lg font-bold text-emerald-400"
      >
        YES
      </motion.div>
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute right-4 top-4 z-10 rotate-[12deg] rounded-md border-2 border-red-400 px-3 py-1 text-lg font-bold text-red-400"
      >
        NO
      </motion.div>
      <VenueCard venue={venue} />
    </motion.div>
  );
}
