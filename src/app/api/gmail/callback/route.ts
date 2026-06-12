import { NextRequest } from "next/server";
import { exchangeCode, storeTokens, verifyState } from "@/lib/gmail/oauth";

/** GET /api/gmail/callback — Google redirects here after consent. */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const { searchParams } = request.nextUrl;

  const error = searchParams.get("error");
  if (error) {
    return Response.redirect(`${appUrl}/settings?gmail_error=${encodeURIComponent(error)}`, 302);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return Response.redirect(`${appUrl}/settings?gmail_error=missing_params`, 302);
  }

  const userId = verifyState(state);
  if (!userId) {
    return Response.redirect(`${appUrl}/settings?gmail_error=bad_state`, 302);
  }

  try {
    const tokens = await exchangeCode(code);
    await storeTokens(userId, tokens);
  } catch (err) {
    console.error("Gmail connect failed:", err);
    return Response.redirect(`${appUrl}/settings?gmail_error=exchange_failed`, 302);
  }

  return Response.redirect(`${appUrl}/settings?connected=1`, 302);
}
