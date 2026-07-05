import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildConsentUrl } from "@/lib/gmail/oauth";
import { isPlatformAdmin, PLATFORM_STATE_SUBJECT } from "@/lib/gmail/platform";

/** GET /api/admin/gmail/connect — start OAuth for the platform outreach mailbox. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdmin(user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  redirect(buildConsentUrl(PLATFORM_STATE_SUBJECT));
}
