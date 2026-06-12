import { createClient } from "@/lib/supabase/server";
import { buildConsentUrl } from "@/lib/gmail/oauth";

/** GET /api/gmail/connect — redirect the signed-in user to Google consent. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`, 302);
  }
  return Response.redirect(buildConsentUrl(user.id), 302);
}
