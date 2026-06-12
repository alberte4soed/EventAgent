import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/venues/[venueId]/swipe — body: { decision: 'liked' | 'rejected' } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId } = await params;
  const { decision } = (await request.json()) as { decision?: string };
  if (decision !== "liked" && decision !== "rejected") {
    return Response.json({ error: "decision must be 'liked' or 'rejected'" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("venues")
    .update({ swipe_status: decision })
    .eq("id", venueId)
    .select("id, swipe_status")
    .single();
  if (error || !data) {
    return Response.json({ error: "Venue not found" }, { status: 404 });
  }
  return Response.json(data);
}
