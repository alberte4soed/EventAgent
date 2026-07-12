import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { runAgentTurn } from "@/lib/gemini/agent";
import { logAgentError } from "@/lib/gemini/log";
import type {
  ChatMessageRow,
  EmailReplyRow,
  EventRow,
  ReplyProposalRow,
  VenueRow,
} from "@/lib/db/types";

export const maxDuration = 120; // agent turns can chain several Gemini calls

/** System-prompt context block describing the vendor reply under discussion. */
async function buildReplyContext(
  supabase: SupabaseClient,
  replyId: string,
  eventId: string
): Promise<string | undefined> {
  const { data: reply } = await supabase
    .from("email_replies")
    .select("*")
    .eq("id", replyId)
    .eq("event_id", eventId)
    .maybeSingle();
  if (!reply) return undefined;
  const replyRow = reply as EmailReplyRow;

  const [{ data: venue }, { data: proposal }] = await Promise.all([
    supabase.from("venues").select("name, category").eq("id", replyRow.venue_id).maybeSingle(),
    supabase
      .from("reply_proposals")
      .select("*")
      .eq("email_reply_id", replyId)
      .eq("status", "proposed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const venueRow = venue as Pick<VenueRow, "name" | "category"> | null;
  const proposalRow = proposal as ReplyProposalRow | null;

  return [
    `DISCUSSION CONTEXT — the user is talking about a reply from "${venueRow?.name ?? "a vendor"}"${
      venueRow?.category && venueRow.category !== "venue" ? ` (${venueRow.category})` : ""
    } (reply_id: ${replyId}).`,
    `Their message: ${(replyRow.body ?? replyRow.snippet ?? "").slice(0, 1500)}`,
    proposalRow
      ? `Your current proposed reply: ${proposalRow.body.slice(0, 800)}`
      : "There is no proposed reply yet.",
    `If the user wants to change the reply, call propose_vendor_reply with reply_id "${replyId}" and the revised body.`,
  ].join("\n");
}

/**
 * POST /api/chat — run one agent turn.
 * Body: { eventId?: string, message: string }
 * Responds with an SSE stream:
 *   event: status  → data: {"status": "Searching the web…"}
 *   event: event   → data: {"eventId": "..."}        (when a new event is created)
 *   event: message → data: <persisted assistant ChatMessageRow>
 *   event: error   → data: {"error": "..."}
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, message, contextReplyId } = (await request.json()) as {
    eventId?: string;
    message?: string;
    contextReplyId?: string;
  };
  if (!message?.trim()) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  // Load or create the event.
  let event: EventRow;
  if (eventId) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
    if (error || !data) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    event = data as EventRow;
  } else {
    const { data, error } = await supabase
      .from("events")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error || !data) {
      return Response.json({ error: error?.message ?? "Could not create event" }, { status: 500 });
    }
    event = data as EventRow;
  }

  const { data: historyData } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true })
    .limit(50);
  const history = (historyData ?? []) as ChatMessageRow[];

  // When the user is discussing a specific vendor reply (from the outreach
  // inbox), give the agent that thread's context so it can revise the response.
  const replyContext = contextReplyId
    ? await buildReplyContext(supabase, contextReplyId, event.id)
    : undefined;

  // Respond in the couple's chosen language.
  const { data: prof } = await supabase
    .from("profiles")
    .select("language")
    .eq("user_id", user.id)
    .maybeSingle();
  const languageDirective =
    prof?.language === "en"
      ? "Always reply to the couple in English."
      : "Svar altid parret på dansk.";
  const extraContext = [languageDirective, replyContext].filter(Boolean).join("\n\n");

  const { data: userMsg, error: userMsgError } = await supabase
    .from("chat_messages")
    .insert({
      event_id: event.id,
      user_id: user.id,
      role: "user",
      content: message,
    })
    .select()
    .single();
  if (userMsgError || !userMsg) {
    return Response.json(
      { error: userMsgError?.message ?? "Could not save message" },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (eventName: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      try {
        if (!eventId) send("event", { eventId: event.id });
        // Lets the client swap its optimistic bubble for the persisted row.
        send("user_message", userMsg);

        const result = await runAgentTurn(
          supabase,
          event,
          history,
          message,
          (status) => send("status", { status }),
          extraContext
        );

        const { data: saved, error } = await supabase
          .from("chat_messages")
          .insert({
            event_id: event.id,
            user_id: user.id,
            role: "assistant",
            content: result.text,
            payload: result.payload,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);

        send("message", saved);
      } catch (err) {
        logAgentError("api/chat", err, {
          userId: user.id,
          eventId: event.id,
          historyLength: history.length,
          messageLength: message.length,
        });
        send("error", { error: err instanceof Error ? err.message : "Agent failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
