import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/replies/[replyId]/read — mark a vendor reply as read. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  const { replyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("email_replies")
    .update({ read_at: new Date().toISOString() })
    .eq("id", replyId)
    .is("read_at", null);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
