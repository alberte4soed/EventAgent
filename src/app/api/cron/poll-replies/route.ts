import { NextRequest } from "next/server";
import { pollPlatformReplies } from "@/lib/gmail/poll";

export const maxDuration = 300;

/**
 * GET /api/cron/poll-replies — Vercel Cron entrypoint (see vercel.json).
 * Polls the platform Kalas mailbox for vendor replies across all users:
 * quotes are extracted, attachments stored, and Ava reply proposals queued.
 * Protected by CRON_SECRET bearer auth.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await pollPlatformReplies();
    return Response.json(summary);
  } catch (err) {
    console.error("Platform poll failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
