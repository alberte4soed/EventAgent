import type { EventStatus } from "@/lib/db/types";

const LABELS: Record<EventStatus, { label: string; classes: string }> = {
  gathering: { label: "Gathering details", classes: "bg-stone-100 text-stone-600" },
  searching: { label: "Searching venues", classes: "bg-sky-50 text-sky-700" },
  swiping: { label: "Swiping", classes: "bg-violet-50 text-violet-700" },
  drafting: { label: "Drafting email", classes: "bg-amber-50 text-amber-700" },
  sending: { label: "Sending", classes: "bg-amber-50 text-amber-700" },
  awaiting_replies: { label: "Awaiting replies", classes: "bg-blue-50 text-blue-700" },
  done: { label: "Done", classes: "bg-[#eef0ec] text-[#5e6b58]" },
};

export function StatusChip({ status }: { status: EventStatus }) {
  const { label, classes } = LABELS[status] ?? LABELS.gathering;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
