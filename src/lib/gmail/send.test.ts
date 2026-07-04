import { describe, it, expect } from "vitest";
import { buildRawMessage } from "./send";

function decode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

describe("buildRawMessage", () => {
  it("includes threading + reply headers when provided", () => {
    const msg = decode(
      buildRawMessage({
        to: "venue@example.com",
        subject: "Re: your wedding",
        body: "hello",
        fromName: "Ava at Kalas",
        fromEmail: "kalas@example.com",
        replyTo: "kalas+abcд1234@example.com".replace("д", "d"),
        inReplyTo: "<msg-1@example.com>",
        references: "<msg-1@example.com>",
      })
    );
    expect(msg).toContain("From: Ava at Kalas <kalas@example.com>");
    expect(msg).toContain("Reply-To: kalas+abcd1234@example.com");
    expect(msg).toContain("In-Reply-To: <msg-1@example.com>");
    expect(msg).toContain("References: <msg-1@example.com>");
    expect(msg).toContain("To: venue@example.com");
  });

  it("omits the From header when fromEmail is missing", () => {
    const msg = decode(
      buildRawMessage({ to: "a@b.com", subject: "hi", body: "x", fromName: "Ava" })
    );
    expect(msg).not.toContain("From:");
  });

  it("RFC 2047-encodes non-ASCII subjects", () => {
    const msg = decode(buildRawMessage({ to: "a@b.com", subject: "Rødvig café", body: "x" }));
    expect(msg).toContain("Subject: =?UTF-8?B?");
  });
});
