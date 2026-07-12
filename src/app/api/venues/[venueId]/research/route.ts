import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import {
  VENUE_RESEARCH_EXTRACTION_PROMPT,
  VENUE_RESEARCH_PROMPT,
} from "@/lib/gemini/prompts";
import type { EventRow, VenueRow } from "@/lib/db/types";
import { emailMatchesWebsite } from "@/lib/places/client";
import {
  buildVenueResearchProfile,
  venueResearchSchema,
  type ExtractedVenueResearch,
  type VenueResearchProfile,
} from "@/lib/venue/research";

/**
 * POST /api/venues/[venueId]/research
 *
 * Grounded web search for one venue's wedding pages; extracts briefing,
 * capacity, pricing, practical info and packages into venue_research + columns.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: venueData } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .maybeSingle();
  const venue = venueData as VenueRow | null;
  if (!venue) return Response.json({ error: "Venue not found" }, { status: 404 });

  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", venue.event_id)
    .maybeSingle();
  const event = eventData as EventRow | null;

  const ai = getGemini();
  let groundedText = "";
  let sourceUrls: string[] = [];

  try {
    const grounded = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: VENUE_RESEARCH_PROMPT({
        name: venue.name,
        address: venue.address,
        website: venue.website,
        guestCount: event?.guest_count,
        eventType: event?.event_type,
      }),
      config: { tools: [{ googleSearch: {} }] },
    });
    groundedText = grounded.text?.trim() ?? "";
    sourceUrls =
      grounded.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((c) => c.web?.uri)
        .filter((u): u is string => Boolean(u)) ?? [];
  } catch (err) {
    const message = err instanceof Error ? err.message : "Web search failed";
    return Response.json({ error: message }, { status: 502 });
  }

  if (!groundedText) {
    return Response.json({ error: "Web search returned no results" }, { status: 502 });
  }

  let extracted: ExtractedVenueResearch;
  try {
    const extraction = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: VENUE_RESEARCH_EXTRACTION_PROMPT(groundedText),
      config: {
        responseMimeType: "application/json",
        responseSchema: venueResearchSchema,
      },
    });
    extracted = JSON.parse(extraction.text ?? "{}") as ExtractedVenueResearch;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return Response.json({ error: message }, { status: 502 });
  }

  if (!extracted.briefing?.length) {
    return Response.json({ error: "Could not extract venue research" }, { status: 502 });
  }

  const profile: VenueResearchProfile = buildVenueResearchProfile(extracted);
  const website = extracted.website?.trim() || venue.website;
  const email = extracted.email?.trim() || venue.email;
  const emailVerified = emailMatchesWebsite(email, website);

  const mergedSources = [
    ...new Set([...(venue.source_urls ?? []), ...sourceUrls]),
  ].slice(0, 20);

  const patch: Partial<VenueRow> = {
    venue_research: profile,
    source_urls: mergedSources,
    description: extracted.description?.trim() || venue.description,
    capacity: extracted.capacity?.trim() || venue.capacity,
    price_hint: extracted.price_hint?.trim() || venue.price_hint,
    why_fit: extracted.why_fit?.trim() || venue.why_fit,
    website: website || venue.website,
    phone: extracted.phone?.trim() || venue.phone,
    email: emailVerified ? email : venue.email,
    contact_verified: emailVerified || venue.contact_verified,
  };

  const { data, error } = await supabase
    .from("venues")
    .update(patch)
    .eq("id", venueId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
