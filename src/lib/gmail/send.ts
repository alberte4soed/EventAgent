const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Encode a header value as RFC 2047 UTF-8 base64 word when non-ASCII. */
function encodeHeader(value: string): string {
  if (/^[ -~]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

export interface OutgoingMessage {
  to: string;
  subject: string;
  body: string;
  /** Display name for the From header, e.g. "Ava at Kalas". */
  fromName?: string;
  /** Address of the authenticated account; required for fromName to be honored. */
  fromEmail?: string;
  /** Per-event plus-address vendors should reply to, e.g. kalas+tag@domain. */
  replyTo?: string;
  /** Gmail thread to send into (replies). */
  threadId?: string;
  /** RFC 822 Message-ID of the message being replied to. */
  inReplyTo?: string;
  references?: string;
}

/** Build an RFC 2822 plain-text message and base64url-encode it. */
export function buildRawMessage(args: OutgoingMessage): string {
  const headers = [
    // Gmail rewrites From addresses that don't match the account, so the
    // display name only survives when fromEmail is the authenticated address.
    args.fromName && args.fromEmail
      ? `From: ${encodeHeader(args.fromName)} <${args.fromEmail}>`
      : null,
    `To: ${args.to}`,
    args.replyTo ? `Reply-To: ${args.replyTo}` : null,
    args.inReplyTo ? `In-Reply-To: ${args.inReplyTo}` : null,
    args.references ? `References: ${args.references}` : null,
    `Subject: ${encodeHeader(args.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ].filter((h): h is string => Boolean(h));

  const message = [...headers, "", Buffer.from(args.body, "utf8").toString("base64")].join(
    "\r\n"
  );
  return Buffer.from(message, "utf8").toString("base64url");
}

export interface SendResult {
  messageId: string;
  threadId: string;
}

/** Send via Gmail API. Pass threadId to send a reply into an existing thread. */
export async function sendEmail(
  accessToken: string,
  args: OutgoingMessage
): Promise<SendResult> {
  const payload: { raw: string; threadId?: string } = { raw: buildRawMessage(args) };
  if (args.threadId) payload.threadId = args.threadId;

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${data.error?.message ?? "unknown error"}`);
  }
  return { messageId: data.id as string, threadId: data.threadId as string };
}
