import type { EventStatus } from "@/lib/db/types";

const LABELS: Record<EventStatus, { label: string; classes: string }> = {
  gathering: { label: "Gathering details", classes: "bg-zinc-800 text-zinc-300" },
  searching: { label: "Searching venues", classes: "bg-sky-950 text-sky-300" },
  swiping: { label: "Swiping", classes: "bg-violet-950 text-violet-300" },
  drafting: { label: "Drafting email", classes: "bg-amber-950 text-amber-300" },
  sending: { label: "Sending", classes: "bg-amber-950 text-amber-300" },
  awaiting_replies: { label: "Awaiting replies", classes: "bg-blue-950 text-blue-300" },
  done: { label: "Done", classes: "bg-emerald-950 text-emerald-300" },
};

export function StatusChip({ status }: { status: EventStatus }) {
  const { label, classes } = LABELS[status] ?? LABELS.gathering;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
