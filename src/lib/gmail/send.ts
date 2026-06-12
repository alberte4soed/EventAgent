const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

/** Encode a header value as RFC 2047 UTF-8 base64 word when non-ASCII. */
function encodeHeader(value: string): string {
  if (/^[ -~]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/** Build an RFC 2822 plain-text message and base64url-encode it. */
export function buildRawMessage(args: {
  to: string;
  subject: string;
  body: string;
}): string {
  const message = [
    `To: ${args.to}`,
    `Subject: ${encodeHeader(args.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(args.body, "utf8").toString("base64"),
  ].join("\r\n");
  return Buffer.from(message, "utf8").toString("base64url");
}

export interface SendResult {
  messageId: string;
  threadId: string;
}

/** Send via Gmail API; the From header is the authenticated user automatically. */
export async function sendEmail(
  accessToken: string,
  args: { to: string; subject: string; body: string }
): Promise<SendResult> {
  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: buildRawMessage(args) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${data.error?.message ?? "unknown error"}`);
  }
  return { messageId: data.id as string, threadId: data.threadId as string };
}
