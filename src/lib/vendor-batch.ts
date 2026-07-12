import type { MessagePayload } from "@/lib/db/types";
import type { VendorCategory } from "@/lib/db/types";

export type BatchScreen = "venues" | "vendors";

/** UI category chip id used on the Suppliers page. */
export type SupplierCatFilter =
  | "alle"
  | "fotografi"
  | "video"
  | "blomster"
  | "catering"
  | "bar"
  | "kage"
  | "musik"
  | "beauty";

const SUPPLIER_CAT: Partial<Record<VendorCategory, SupplierCatFilter>> = {
  photographer: "fotografi",
  florist: "blomster",
  caterer: "catering",
  musician: "musik",
};

const BATCH_LABEL_DA: Record<VendorCategory, string> = {
  venue: "{n} venues lagt på jeres board — se dem",
  photographer: "{n} fotografer lagt på jeres board — se dem",
  florist: "{n} blomsterleverandører lagt på jeres board — se dem",
  musician: "{n} musikere lagt på jeres board — se dem",
  caterer: "{n} catering-leverandører lagt på jeres board — se dem",
  planner: "{n} planlæggere lagt på jeres board — se dem",
  other: "{n} leverandører lagt på jeres board — se dem",
};

const BATCH_LABEL_EN: Record<VendorCategory, string> = {
  venue: "{n} venues added to your board — see them",
  photographer: "{n} photographers added to your board — see them",
  florist: "{n} florists added to your board — see them",
  musician: "{n} musicians added to your board — see them",
  caterer: "{n} caterers added to your board — see them",
  planner: "{n} planners added to your board — see them",
  other: "{n} vendors added to your board — see them",
};

export function batchCategory(
  payload: Extract<MessagePayload, { kind: "venue_batch" }>,
  rows: { id: string; category: VendorCategory }[],
): VendorCategory {
  if (payload.category) return payload.category;
  const match = rows.find((row) => payload.venue_ids.includes(row.id));
  return match?.category ?? "venue";
}

export function batchScreen(category: VendorCategory): BatchScreen {
  return category === "venue" ? "venues" : "vendors";
}

export function batchSupplierFilter(category: VendorCategory): SupplierCatFilter | null {
  return SUPPLIER_CAT[category] ?? (category === "venue" ? null : "alle");
}

export function batchLabel(category: VendorCategory, lang: "da" | "en", count: number): string {
  const template = (lang === "en" ? BATCH_LABEL_EN : BATCH_LABEL_DA)[category];
  return template.replace("{n}", String(count));
}
