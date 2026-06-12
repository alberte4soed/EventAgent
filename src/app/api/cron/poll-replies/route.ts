import { NextRequest } from "next/server";
import { pollUserReplies, getUsersAwaitingReplies } from "@/lib/gmail/poll";

export const maxDuration = 300;

/**
 * GET /api/cron/poll-replies — Vercel Cron entrypoint (see vercel.json).
 * Polls every user with outreach in flight for new Gmail replies and
 * extracts quotes. Protected by CRON_SECRET bearer auth.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIds = await getUsersAwaitingReplies();
  const summaries = [];
  for (const userId of userIds) {
    try {
      summaries.push(await pollUserReplies(userId));
    } catch (err) {
      console.error(`Polling failed for user ${userId}:`, err);
      summaries.push({
        userId,
        checked: 0,
        newReplies: 0,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return Response.json({ polled: userIds.length, summaries });
}
