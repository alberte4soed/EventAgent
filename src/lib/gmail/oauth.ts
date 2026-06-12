import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";
import type { GoogleTokensRow } from "@/lib/db/types";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "openid",
  "email",
];

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Thrown when the refresh token is revoked/expired — UI should prompt reconnect. */
export class GmailNotConnectedError extends Error {
  constructor(message = "Gmail is not connected") {
    super(message);
    this.name = "GmailNotConnectedError";
  }
}

// ── CSRF state: HMAC-signed user id so the callback can trust it ───────

function sign(value: string): string {
  return createHmac("sha256", process.env.TOKEN_ENCRYPTION_KEY!)
    .update(value)
    .digest("base64url");
}

export function buildState(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifyState(state: string): string | null {
  const dot = state.lastIndexOf(".");
  if (dot < 0) return null;
  const userId = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

// ── OAuth flow ──────────────────────────────────────────────────────────

export function buildConsentUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // guarantees a refresh token every time
    state: buildState(userId),
  });
  return `${AUTH_URL}?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(`Token exchange failed: ${data.error_description ?? data.error ?? res.status}`);
  }
  return data;
}

/** Persist tokens after the consent callback. */
export async function storeTokens(userId: string, tokens: TokenResponse): Promise<void> {
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token — retry the connection");
  }
  // Decode the unverified id_token payload just to record which Gmail account this is.
  let googleEmail: string | null = null;
  if (tokens.id_token) {
    try {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64url").toString("utf8")
      );
      googleEmail = payload.email ?? null;
    } catch {
      // non-fatal
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("google_tokens").upsert({
    user_id: userId,
    google_email: googleEmail,
    refresh_token_enc: encrypt(tokens.refresh_token),
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scopes: tokens.scope.split(" "),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/**
 * Get a valid Gmail access token for a user, refreshing if expired.
 * Throws GmailNotConnectedError when not connected or the grant was revoked.
 */
export async function getAccessToken(userId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as GoogleTokensRow | null;
  if (!row) throw new GmailNotConnectedError();

  const expiresAt = row.access_token_expires_at
    ? new Date(row.access_token_expires_at).getTime()
    : 0;
  if (row.access_token && expiresAt - Date.now() > 60_000) {
    return row.access_token;
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: decrypt(row.refresh_token_enc),
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const tokens = (await res.json()) as TokenResponse;
  if (!res.ok || tokens.error) {
    if (tokens.error === "invalid_grant") {
      // Revoked — drop the row so the UI shows "Connect Gmail" again.
      await admin.from("google_tokens").delete().eq("user_id", userId);
      throw new GmailNotConnectedError("Gmail access was revoked — please reconnect");
    }
    throw new Error(`Token refresh failed: ${tokens.error_description ?? tokens.error ?? res.status}`);
  }

  await admin
    .from("google_tokens")
    .update({
      access_token: tokens.access_token,
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return tokens.access_token;
}

/** Whether the user has Gmail connected (for settings/UI checks). */
export async function getGmailConnection(
  userId: string
): Promise<{ connected: boolean; email: string | null }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("google_tokens")
    .select("google_email")
    .eq("user_id", userId)
    .maybeSingle();
  return { connected: Boolean(data), email: data?.google_email ?? null };
}
