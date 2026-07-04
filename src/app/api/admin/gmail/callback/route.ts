import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, verifyState } from "@/lib/gmail/oauth";
import {
  isPlatformAdmin,
  storePlatformTokens,
  PLATFORM_STATE_SUBJECT,
} from "@/lib/gmail/platform";

/** GET /api/admin/gmail/callback — OAuth callback for the platform mailbox. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || verifyState(state) !== PLATFORM_STATE_SUBJECT) {
    redirect("/settings?gmail_error=invalid_state");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformAdmin(user.email)) {
    redirect("/settings?gmail_error=forbidden");
  }

  try {
    const tokens = await exchangeCode(code!);
    await storePlatformTokens(tokens);
  } catch (err) {
    console.error("[admin/gmail/callback]", err);
    redirect("/settings?gmail_error=exchange_failed");
  }
  redirect("/settings?platform_connected=1");
}
