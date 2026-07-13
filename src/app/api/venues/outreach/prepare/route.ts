import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import type { EventRow, ProfileRow, VenueRow, EmailDraftRow } from "@/lib/db/types";

/**
 * POST /api/venues/outreach/prepare
 *
 * Prepares (without the chat agent) a single master outreach draft for the
 * couple's listed venues, so the Venues "review & approve" page can show what
 * Ava will send and to whom. Idempotent: if a proposed venue draft already
 * exists it is returned as-is. Approving is the existing
 * POST /api/drafts/[draftId]/approve flow.
 */

const draftSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body_template: { type: Type.STRING },
  },
  required: ["subject", "body_template"],
};

async function resolveEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<EventRow | null> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("active_event_id")
    .eq("user_id", userId)
    .maybeSingle();
  const activeId = (profileRow as Pick<ProfileRow, "active_event_id"> | null)?.active_event_id;
  if (activeId) {
    const { data } = await supabase.from("events").select("*").eq("id", activeId).maybeSingle();
    if (data) return data as EventRow;
  }
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as EventRow | null) ?? null;
}

function dateLabel(event: EventRow): string {
  if (event.event_date) return event.event_date;
  if (event.date_hint) return event.date_hint;
  return "endnu ikke fastlagt";
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const event = await resolveEvent(supabase, user.id);
  if (!event) return Response.json({ error: "No wedding found" }, { status: 404 });

  // Idempotent — reuse an existing unsent venue draft.
  const { data: existing } = await supabase
    .from("email_drafts")
    .select("*")
    .eq("event_id", event.id)
    .eq("category", "venue")
    .eq("status", "proposed")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return Response.json({ draft: existing as EmailDraftRow, reused: true });

  // Who would be contacted: liked venues not yet reached out to.
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name, swipe_status, category")
    .eq("event_id", event.id)
    .eq("category", "venue")
    .eq("swipe_status", "liked");
  const liked = (venueRows as Pick<VenueRow, "id" | "name">[] | null) ?? [];
  if (liked.length === 0) {
    return Response.json({ error: "no_venues", message: "Ingen venues på listen at kontakte endnu." }, { status: 400 });
  }

  const guests = event.guest_count ?? undefined;
  const brief = `
You are Ava, a warm, professional wedding planning assistant writing on behalf of a couple.
Write ONE reusable outreach email (Danish) to a wedding venue asking about availability and pricing.

Couple / event context:
- Wedding: ${event.title}
- Location interest: ${event.location ?? "fleksibelt"}
- Date: ${dateLabel(event)}
- Guests: ${guests ? `ca. ${guests}` : "ikke fastlagt endnu"}
- Budget: ${event.budget ?? "ikke oplyst"}

Requirements:
- The body MUST address the venue with the literal placeholder {{venue_name}} (it is substituted per venue).
- Warm but concise; introduce the couple briefly, state date + guest count, and ask about availability, capacity, packages and pricing, and next steps for a visit.
- Sign off as "Ava — på vegne af parret" (do not invent names/emails).
- subject: a short, clear subject line (may reference the date/guest count).
- body_template: the full email body in Danish, plain text, including the {{venue_name}} placeholder near the greeting.
`.trim();

  let subject = "";
  let body = "";
  try {
    const ai = getGemini();
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: brief,
      config: { responseMimeType: "application/json", responseSchema: draftSchema },
    });
    const parsed = JSON.parse(res.text ?? "{}") as { subject?: string; body_template?: string };
    subject = (parsed.subject ?? "").trim();
    body = (parsed.body_template ?? "").trim();
  } catch {
    // Fall through to the deterministic fallback below.
  }

  // Robust fallback so the review page always has something to approve.
  if (!subject) subject = `Forespørgsel: bryllup ${guests ? `for ${guests} gæster ` : ""}${dateLabel(event)}`;
  if (!body || !body.includes("{{venue_name}}")) {
    body = `Kære {{venue_name}}

Vi er ved at planlægge vores bryllup${guests ? ` for ca. ${guests} gæster` : ""} og overvejer jeres smukke sted.

Dato: ${dateLabel(event)}${event.location ? `\nOmråde: ${event.location}` : ""}

Har I ledigt på datoen, og kan I fortælle lidt om kapacitet, pakker og priser? Vi vil også meget gerne høre om mulighed for en fremvisning.

Mange tak på forhånd.

Kærlig hilsen
Ava — på vegne af parret`;
  }

  const { data: latest } = await supabase
    .from("email_drafts")
    .select("version")
    .eq("event_id", event.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = ((latest as { version?: number } | null)?.version ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from("email_drafts")
    .insert({
      event_id: event.id,
      user_id: event.user_id,
      subject,
      body_template: body,
      version,
      category: "venue",
    })
    .select("*")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("events").update({ status: "drafting" }).eq("id", event.id);
  return Response.json({ draft: inserted as EmailDraftRow, reused: false, recipients: liked.length });
}
