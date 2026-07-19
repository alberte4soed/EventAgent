// Hand-written row types mirroring supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once a project is linked.

import type { VenueResearchProfile } from "@/lib/venue/research";

export type EventStatus =
  | "gathering"
  | "searching"
  | "swiping"
  | "drafting"
  | "sending"
  | "awaiting_replies"
  | "done";

export type DatePrecision = "exact" | "month" | "season" | "undecided";

export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  event_type: string | null;
  location: string | null;
  guest_count: number | null;
  event_date: string | null;
  date_precision: DatePrecision;
  date_hint: string | null;
  budget: string | null;
  requirements: Record<string, unknown>;
  status: EventStatus;
  chosen_venue_id: string | null;
  journey_overrides: Record<string, string>;
  reply_tag: string | null;
  created_at: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

/** Rich-block payloads rendered inline in the chat. */
export type MessagePayload =
  | { kind: "venue_batch"; venue_ids: string[]; category?: VendorCategory }
  | { kind: "draft"; draft_id: string }
  | { kind: "send_report"; sent: number; failed: number; skipped: number }
  | { kind: "invite_brief"; wording: string; style: string | null }
  | { kind: "reply_proposal"; proposal_id: string };

export interface ChatMessageRow {
  id: string;
  event_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  payload: MessagePayload | null;
  created_at: string;
}

export type SwipeStatus = "pending" | "liked" | "rejected";

export type VendorCategory =
  | "venue"
  | "florist"
  | "photographer"
  | "musician"
  | "caterer"
  | "planner"
  | "other";

export interface VenueReview {
  author: string | null;
  rating: number | null;
  text: string | null;
  relative_time: string | null;
}

export interface VenueRow {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  capacity: string | null;
  price_hint: string | null;
  image_url: string | null;
  source_urls: string[];
  swipe_status: SwipeStatus;
  email_lookup_status: "not_needed" | "pending" | "found" | "not_found";
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  reviews: VenueReview[];
  photo_urls: string[];
  lat: number | null;
  lng: number | null;
  price_level: string | null;
  business_status: string | null;
  why_fit: string | null;
  contact_verified: boolean;
  category: VendorCategory;
  booked_at: string | null;
  venue_research: VenueResearchProfile | null;
  created_at: string;
}

export interface EmailDraftRow {
  id: string;
  event_id: string;
  user_id: string;
  subject: string;
  body_template: string;
  status: "proposed" | "approved" | "sent";
  version: number;
  category: VendorCategory;
  created_at: string;
}

export interface OutboundEmailRow {
  id: string;
  event_id: string;
  venue_id: string;
  draft_id: string | null;
  user_id: string;
  to_email: string;
  subject: string;
  body: string;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  status: "queued" | "sent" | "failed" | "replied";
  error: string | null;
  sent_at: string | null;
  kind: "outreach" | "reply";
  in_reply_to_reply_id: string | null;
  created_at: string;
}

export interface QuoteExtraction {
  has_quote: boolean;
  price_amount: number | null;
  currency: string | null;
  price_basis: string | null;
  availability: "available" | "unavailable" | "unclear";
  conditions: string | null;
  summary: string;
}

export interface EmailReplyRow {
  id: string;
  outbound_email_id: string | null;
  venue_id: string;
  event_id: string;
  user_id: string;
  gmail_message_id: string;
  from_email: string | null;
  snippet: string | null;
  body: string | null;
  received_at: string | null;
  quote: QuoteExtraction | null;
  quote_status: "quoted" | "no_availability" | "needs_info" | "unclear" | null;
  rfc822_message_id: string | null;
  read_at: string | null;
  matched_via: "thread" | "tag" | "sender";
  created_at: string;
}

export interface EmailAttachmentRow {
  id: string;
  email_reply_id: string;
  venue_id: string;
  event_id: string;
  user_id: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
}

export type ReplyProposalStatus = "proposed" | "sent" | "dismissed" | "superseded";

export interface ReplyProposalRow {
  id: string;
  email_reply_id: string;
  outbound_email_id: string;
  venue_id: string;
  event_id: string;
  user_id: string;
  body: string;
  status: ReplyProposalStatus;
  sent_outbound_id: string | null;
  created_at: string;
}

export interface InviteDesignRow {
  id: string;
  event_id: string;
  user_id: string;
  style: string | null;
  palette: string | null;
  storage_path: string;
  selected: boolean;
  created_at: string;
}

export interface PlatformGmailTokensRow {
  id: number;
  google_email: string;
  refresh_token_enc: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  scopes: string[];
  last_history_id: string | null;
  last_polled_at: string | null;
  updated_at: string;
}

export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  partner_name: string | null;
  home_city: string | null;
  event_interests: string[];
  accent: string;
  onboarded: boolean;
  active_event_id: string | null;
  language: AppLanguage;
  created_at: string;
  updated_at: string;
}

// Supported UI languages. Danish is the source language (its dictionary is
// the source strings themselves). To add a language: add its code here, then
// register a dictionary + label in src/kalas/i18n.tsx — nothing else changes.
export const APP_LANGUAGES = ["da", "en"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (APP_LANGUAGES as readonly string[]).includes(value);
}

export type InviteOrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "submitted_to_print"
  | "shipped"
  | "canceled";

export interface InviteOrderRow {
  id: string;
  event_id: string;
  user_id: string;
  style: string | null;
  palette: string | null;
  wording: string | null;
  quantity: number;
  design_file_url: string | null;
  amount_cents: number | null;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  status: InviteOrderStatus;
  created_at: string;
}

export interface GoogleTokensRow {
  user_id: string;
  google_email: string | null;
  refresh_token_enc: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  scopes: string[];
  updated_at: string;
}

// ── Planning tables (migration 0007) ────────────────────────────────────

export interface BudgetItemRow {
  id: string;
  event_id: string;
  user_id: string;
  category: string;
  label: string;
  planned_amount: number;
  paid_amount: number;
  sort: number;
  created_at: string;
}

export type RsvpStatus = "afventer" | "ja" | "nej";

export interface GuestRow {
  id: string;
  event_id: string;
  user_id: string;
  name: string;
  side: string;
  email: string | null;
  phone: string | null;
  rsvp: RsvpStatus;
  meal: string | null;
  plus_one: boolean;
  notes: string | null;
  dietary: string | null;
  plus_one_name: string | null;
  responded_at: string | null;
  rsvp_token: string;
  created_at: string;
}

export interface TimelineTaskRow {
  id: string;
  event_id: string;
  user_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  category: string | null;
  sort: number;
  created_at: string;
}

export interface MoodboardItemRow {
  id: string;
  event_id: string;
  user_id: string;
  image_key: string | null;
  image_url: string | null;
  storage_path: string | null;
  note: string | null;
  created_at: string;
}

export interface WeddingSiteRow {
  id: string;
  event_id: string;
  user_id: string;
  config: Record<string, unknown>;
  domain: string | null;
  published: boolean;
  updated_at: string;
}

// ── AI website tables (migration 0012) ──────────────────────────────────

export interface WebsiteDesignRow {
  id: string;
  event_id: string;
  user_id: string;
  brief: Record<string, unknown>;
  design: Record<string, unknown>;
  /** Sanitized model-built site markup; null → token-renderer fallback. */
  html: string | null;
  active: boolean;
  created_at: string;
}

export type SitePhotoKind = "upload" | "generated";
export type SitePhotoRole = "hero" | "gallery" | "section";

export interface SitePhotoRow {
  id: string;
  event_id: string;
  user_id: string;
  storage_path: string;
  kind: SitePhotoKind;
  role: SitePhotoRole;
  /** For role='section': which site section this generated image belongs to. */
  section: string | null;
  sort: number;
  created_at: string;
}

export type WebsiteOrderStatus = "pending_payment" | "paid" | "canceled";

export interface WebsiteOrderRow {
  id: string;
  event_id: string;
  user_id: string;
  amount_cents: number | null;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  status: WebsiteOrderStatus;
  created_at: string;
}

export interface SeatingPlanRow {
  id: string;
  event_id: string;
  user_id: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface RegistryItemRow {
  id: string;
  event_id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  store_name: string | null;
  price_cents: number | null;
  currency: string;
  quantity: number;
  sort: number;
  created_at: string;
}

export interface RegistryClaimRow {
  id: string;
  item_id: string;
  event_id: string;
  user_id: string;
  guest_name: string;
  guest_email: string | null;
  message: string | null;
  quantity: number;
  created_at: string;
}
