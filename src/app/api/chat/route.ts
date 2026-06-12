import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runAgentTurn } from "@/lib/gemini/agent";
import { logAgentError } from "@/lib/gemini/log";
import type { ChatMessageRow, EventRow } from "@/lib/db/types";

export const maxDuration = 120; // agent turns can chain several Gemini calls

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

  const { eventId, message } = (await request.json()) as {
    eventId?: string;
    message?: string;
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

  await supabase.from("chat_messages").insert({
    event_id: event.id,
    user_id: user.id,
    role: "user",
    content: message,
  });

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

        const result = await runAgentTurn(supabase, event, history, message, (status) =>
          send("status", { status })
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
