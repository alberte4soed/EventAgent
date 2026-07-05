import { createHmac, timingSafeEqual } from "crypto";
import { decrypt } from "@/lib/crypto";

// gmail.modify covers send + read + label management for the platform mailbox.
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "openid",
  "email",
];

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Thrown when the platform mailbox is disconnected or its grant was revoked. */
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

/** Consent URL for the platform mailbox; `subject` rides in the signed state. */
export function buildConsentUrl(subject: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // guarantees a refresh token every time
    state: buildState(subject),
  });
  return `${AUTH_URL}?${params}`;
}

export interface TokenResponse {
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

/**
 * Exchange an encrypted refresh token for a fresh access token.
 * Throws GmailNotConnectedError on invalid_grant (revoked).
 */
export async function refreshAccessToken(refreshTokenEnc: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: decrypt(refreshTokenEnc),
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const tokens = (await res.json()) as TokenResponse;
  if (!res.ok || tokens.error) {
    if (tokens.error === "invalid_grant") {
      throw new GmailNotConnectedError("Mailbox access was revoked — reconnect it");
    }
    throw new Error(
      `Token refresh failed: ${tokens.error_description ?? tokens.error ?? res.status}`
    );
  }
  return tokens;
}

/** Email address embedded in an (unverified) id_token, if any. */
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
    );
    return payload.email ?? null;
  } catch {
    return null;
  }
}
