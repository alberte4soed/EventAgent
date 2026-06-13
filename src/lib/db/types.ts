// Hand-written row types mirroring supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once a project is linked.

export type EventStatus =
  | "gathering"
  | "searching"
  | "swiping"
  | "drafting"
  | "sending"
  | "awaiting_replies"
  | "done";

export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  event_type: string | null;
  location: string | null;
  guest_count: number | null;
  event_date: string | null;
  budget: string | null;
  requirements: Record<string, unknown>;
  status: EventStatus;
  created_at: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

/** Rich-block payloads rendered inline in the chat. */
export type MessagePayload =
  | { kind: "venue_batch"; venue_ids: string[] }
  | { kind: "draft"; draft_id: string }
  | { kind: "send_report"; sent: number; failed: number; skipped: number };

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
  outbound_email_id: string;
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
  created_at: string;
}

export interface ProfileRow {
  user_id: string;
  display_name: string | null;
  home_city: string | null;
  event_interests: string[];
  accent: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
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
