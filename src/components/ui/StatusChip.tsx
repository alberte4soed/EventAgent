import type { EventStatus } from "@/lib/db/types";

const LABELS: Record<EventStatus, { label: string; classes: string }> = {
  gathering: { label: "Gathering details", classes: "bg-[#e0dac7] text-[#656952]" },
  searching: { label: "Searching venues", classes: "bg-[#e7ecf1] text-[#4d6175]" },
  swiping: { label: "Swiping", classes: "bg-[#efe2ee] text-[#7a4d72]" },
  drafting: { label: "Drafting email", classes: "bg-[#ddd6c0] text-[#8a6d2f]" },
  sending: { label: "Sending", classes: "bg-[#ddd6c0] text-[#8a6d2f]" },
  awaiting_replies: { label: "Awaiting replies", classes: "bg-[#c2b280] text-[#4A4E3C]" },
  done: { label: "Done", classes: "bg-[#e3ece8] text-[#4d6b5c]" },
};

export function StatusChip({ status }: { status: EventStatus }) {
  const { label, classes } = LABELS[status] ?? LABELS.gathering;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
