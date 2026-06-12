import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content, Part } from "@google/genai";
import { getGemini, GEMINI_MODEL } from "./client";
import {
  logAgentError,
  summarizeContents,
  summarizeFunctionCallParts,
} from "./log";
import { functionDeclarations } from "./tools";
import { venueListSchema, quoteSchema, type ExtractedVenue } from "./schemas";
import {
  agentSystemPrompt,
  VENUE_SEARCH_PROMPT,
  VENUE_EXTRACTION_PROMPT,
  FIND_EMAIL_PROMPT,
  PERSONALIZE_PROMPT,
  QUOTE_EXTRACTION_PROMPT,
} from "./prompts";
import type {
  ChatMessageRow,
  EventRow,
  MessagePayload,
  QuoteExtraction,
} from "@/lib/db/types";

const MAX_ITERATIONS = 6;

export interface AgentTurnResult {
  text: string;
  payload: MessagePayload | null;
}

type StatusFn = (status: string) => void;

/**
 * Run one agent turn: feed history + the new user message to Gemini with
 * function declarations, execute any tool calls server-side, loop until the
 * model produces plain text. Tool side effects (event updates, venue inserts,
 * draft rows) are written through the caller's RLS-scoped Supabase client.
 */
export async function runAgentTurn(
  supabase: SupabaseClient,
  event: EventRow,
  history: ChatMessageRow[],
  userMessage: string,
  onStatus: StatusFn = () => {}
): Promise<AgentTurnResult> {
  const ai = getGemini();

  const contents: Content[] = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map<Content>((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  // Mutable copy so tool executors can see updates within this turn.
  let currentEvent = { ...event };
  let payload: MessagePayload | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: agentSystemPrompt(currentEvent),
          tools: [{ functionDeclarations }],
        },
      });
    } catch (err) {
      logAgentError("gemini/agent:generateContent", err, {
        model: GEMINI_MODEL,
        iteration: i,
        eventId: event.id,
        ...summarizeContents(contents),
      });
      throw err;
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      logAgentError(
        "gemini/agent:unexpectedFinishReason",
        new Error(`Unexpected finishReason: ${finishReason}`),
        {
          model: GEMINI_MODEL,
          iteration: i,
          eventId: event.id,
          finishReason,
          promptFeedback: response.promptFeedback,
        }
      );
    }

    const responseContent = response.candidates?.[0]?.content;
    const calls =
      responseContent?.parts
        ?.filter((part) => part.functionCall)
        .map((part) => part.functionCall!) ??
      response.functionCalls ??
      [];
    if (calls.length === 0) {
      return { text: response.text ?? "", payload };
    }

    const callSummary = summarizeFunctionCallParts(responseContent?.parts);
    console.log("[gemini/agent:toolCalls]", {
      model: GEMINI_MODEL,
      iteration: i,
      eventId: event.id,
      tools: callSummary.names,
      thoughtSignatures: callSummary.hasThoughtSignature,
      contentsLength: contents.length,
    });

    // Push the API content verbatim — required for thoughtSignature on Gemini 2.5+/3.x.
    contents.push(responseContent);

    const responseParts: Part[] = [];
    for (const call of calls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      let result: Record<string, unknown>;
      try {
        switch (call.name) {
          case "update_event_details":
            onStatus("Saving event details…");
            result = await execUpdateEventDetails(supabase, currentEvent, args);
            currentEvent = (result.event as EventRow) ?? currentEvent;
            delete result.event;
            break;
          case "search_venues": {
            onStatus("Searching the web for venues…");
            const search = await execSearchVenues(supabase, currentEvent, args);
            result = { venue_count: search.venueIds.length, venue_names: search.names };
            if (search.venueIds.length > 0) {
              payload = { kind: "venue_batch", venue_ids: search.venueIds };
            }
            break;
          }
          case "find_venue_email":
            onStatus(`Looking up contact email for ${String(args.venue_name ?? "venue")}…`);
            result = await execFindVenueEmail(supabase, args);
            break;
          case "propose_email_draft": {
            onStatus("Drafting the quote-request email…");
            const draft = await execProposeDraft(supabase, currentEvent, args);
            result = { draft_id: draft.id, version: draft.version };
            payload = { kind: "draft", draft_id: draft.id };
            break;
          }
          default:
            logAgentError("gemini/agent:unknownTool", new Error(`Unknown tool: ${call.name}`), {
              eventId: event.id,
              iteration: i,
            });
            result = { error: `Unknown tool: ${call.name}` };
        }
      } catch (err) {
        logAgentError("gemini/agent:toolExecution", err, {
          tool: call.name,
          eventId: event.id,
          iteration: i,
          args,
        });
        result = { error: err instanceof Error ? err.message : String(err) };
      }
      responseParts.push({
        functionResponse: { name: call.name, response: result },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  logAgentError("gemini/agent:maxIterations", new Error("Tool loop exhausted"), {
    model: GEMINI_MODEL,
    eventId: event.id,
    maxIterations: MAX_ITERATIONS,
    ...summarizeContents(contents),
  });

  return {
    text: "I got a bit tangled up there — could you rephrase that?",
    payload,
  };
}

// ── Tool executors ──────────────────────────────────────────────────────

async function execUpdateEventDetails(
  supabase: SupabaseClient,
  event: EventRow,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};
  for (const key of ["title", "event_type", "location", "guest_count", "event_date", "budget"]) {
    if (args[key] !== undefined && args[key] !== null) patch[key] = args[key];
  }
  if (args.requirements && typeof args.requirements === "object") {
    patch.requirements = { ...event.requirements, ...(args.requirements as object) };
  }
  if (Object.keys(patch).length === 0) return { ok: true };

  const { data, error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", event.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { ok: true, event: data as EventRow };
}

/** Two-step grounded search: Call A (Google Search grounding) → Call B (structured extraction). */
async function execSearchVenues(
  supabase: SupabaseClient,
  event: EventRow,
  args: Record<string, unknown>
): Promise<{ venueIds: string[]; names: string[] }> {
  const ai = getGemini();
  const location = String(args.location ?? event.location ?? "");
  const guestCount = (args.guest_count as number | undefined) ?? event.guest_count;
  if (!location) throw new Error("Location is required before searching");

  // Call A: grounded search (no schema/function-calling allowed alongside grounding).
  let grounded;
  try {
    grounded = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: VENUE_SEARCH_PROMPT({
        query: String(args.query ?? ""),
        location,
        guestCount,
        eventType: event.event_type,
      }),
      config: { tools: [{ googleSearch: {} }] },
    });
  } catch (err) {
    logAgentError("gemini/agent:searchVenues:grounded", err, {
      model: GEMINI_MODEL,
      eventId: event.id,
      location,
    });
    throw err;
  }

  const groundedText = grounded.text ?? "";
  if (!groundedText.trim()) throw new Error("Web search returned no results");

  const sourceUrls =
    grounded.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c) => c.web?.uri)
      .filter((u): u is string => Boolean(u)) ?? [];

  // Call B: structured extraction into venue rows.
  let extraction;
  try {
    extraction = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: VENUE_EXTRACTION_PROMPT(groundedText),
      config: {
        responseMimeType: "application/json",
        responseSchema: venueListSchema,
      },
    });
  } catch (err) {
    logAgentError("gemini/agent:searchVenues:extraction", err, {
      model: GEMINI_MODEL,
      eventId: event.id,
      groundedTextLength: groundedText.length,
    });
    throw err;
  }

  const parsed = JSON.parse(extraction.text ?? "{}") as { venues?: ExtractedVenue[] };
  const venues = (parsed.venues ?? []).filter((v) => v.name?.trim());
  if (venues.length === 0) throw new Error("No venues could be extracted from search results");

  const { data, error } = await supabase
    .from("venues")
    .insert(
      venues.map((v) => ({
        event_id: event.id,
        user_id: event.user_id,
        name: v.name,
        description: v.description ?? null,
        address: v.address ?? null,
        website: v.website ?? null,
        email: v.email ?? null,
        phone: v.phone ?? null,
        capacity: v.capacity ?? null,
        price_hint: v.price_hint ?? null,
        source_urls: sourceUrls,
      }))
    )
    .select("id, name");
  if (error) throw new Error(error.message);

  await supabase.from("events").update({ status: "swiping" }).eq("id", event.id);

  return {
    venueIds: (data ?? []).map((d) => d.id as string),
    names: (data ?? []).map((d) => d.name as string),
  };
}

async function execFindVenueEmail(
  supabase: SupabaseClient,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const venueId = String(args.venue_id ?? "");
  const venueName = String(args.venue_name ?? "");
  const email = await findVenueEmail(venueName, args.website as string | undefined);

  await supabase
    .from("venues")
    .update({
      email: email ?? undefined,
      email_lookup_status: email ? "found" : "not_found",
    })
    .eq("id", venueId);

  return email
    ? { found: true, email }
    : { found: false, note: "No contact email found; this venue will be skipped when sending." };
}

/** Grounded lookup of a single venue's contact email. Exported for reuse. */
export async function findVenueEmail(
  venueName: string,
  website?: string | null
): Promise<string | null> {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: FIND_EMAIL_PROMPT(venueName, website),
    config: { tools: [{ googleSearch: {} }] },
  });
  const text = (response.text ?? "").trim();
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!match || text.includes("NOT_FOUND")) return null;
  return match[0].toLowerCase();
}

async function execProposeDraft(
  supabase: SupabaseClient,
  event: EventRow,
  args: Record<string, unknown>
): Promise<{ id: string; version: number }> {
  const subject = String(args.subject ?? "").trim();
  const body = String(args.body_template ?? "").trim();
  if (!subject || !body) throw new Error("Draft needs a subject and body_template");
  if (!body.includes("{{venue_name}}")) {
    throw new Error("body_template must contain the {{venue_name}} placeholder");
  }

  const { data: latest } = await supabase
    .from("email_drafts")
    .select("version")
    .eq("event_id", event.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = (latest?.version ?? 0) + 1;
  const { data, error } = await supabase
    .from("email_drafts")
    .insert({
      event_id: event.id,
      user_id: event.user_id,
      subject,
      body_template: body,
      version,
    })
    .select("id, version")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("events").update({ status: "drafting" }).eq("id", event.id);
  return { id: data.id as string, version: data.version as number };
}

// ── Standalone Gemini helpers used outside the chat loop ────────────────

/** Personalize the approved master template for one venue (plain call, no tools). */
export async function personalizeEmail(args: {
  template: string;
  venueName: string;
  venueDescription?: string | null;
}): Promise<string> {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: PERSONALIZE_PROMPT(args),
  });
  const text = (response.text ?? "").trim();
  // Fall back to simple substitution if the model returns nothing usable.
  return text || args.template.replaceAll("{{venue_name}}", args.venueName);
}

/** Extract quote details from a venue's reply (structured output). */
export async function extractQuote(args: {
  venueName: string;
  replyBody: string;
}): Promise<QuoteExtraction> {
  const ai = getGemini();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: QUOTE_EXTRACTION_PROMPT(args),
    config: {
      responseMimeType: "application/json",
      responseSchema: quoteSchema,
    },
  });
  return JSON.parse(response.text ?? "{}") as QuoteExtraction;
}

export function quoteStatusFromExtraction(
  q: QuoteExtraction
): "quoted" | "no_availability" | "needs_info" | "unclear" {
  if (q.availability === "unavailable") return "no_availability";
  if (q.has_quote) return "quoted";
  if (q.availability === "available") return "needs_info";
  return "unclear";
}
