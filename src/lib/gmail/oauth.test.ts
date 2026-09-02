import { afterEach, describe, expect, it, vi } from "vitest";
import { GmailNotConnectedError, refreshAccessToken } from "./oauth";

/* The encrypted refresh token is decrypted before the request, so the suite
   needs a key of the right shape; the fetch is stubbed either way. */
process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64);
process.env.GOOGLE_CLIENT_ID = "test-client";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";

vi.mock("@/lib/crypto", () => ({ decrypt: () => "refresh-token" }));

function googleReplies(status: number, body: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("refreshAccessToken", () => {
  it("returns the tokens when Google is happy", async () => {
    googleReplies(200, { access_token: "at", expires_in: 3600, scope: "a b" });
    await expect(refreshAccessToken("enc")).resolves.toMatchObject({ access_token: "at" });
  });

  /* Each of these means the grant can never be redeemed again, so they have to
     reach the caller as "reconnect the mailbox", a 503, rather than a 500
     that tells the couple to retry something that cannot succeed. This is the
     bug that made approve-and-send return 500 in production: the mailbox
     answered unauthorized_client and only invalid_grant was being mapped. */
  it.each(["invalid_grant", "unauthorized_client", "invalid_client"])(
    "treats %s as a mailbox that needs reconnecting",
    async (error) => {
      googleReplies(401, { error });
      await expect(refreshAccessToken("enc")).rejects.toBeInstanceOf(GmailNotConnectedError);
    },
  );

  it("names the reason, so the log says which refusal it was", async () => {
    googleReplies(401, { error: "unauthorized_client" });
    await expect(refreshAccessToken("enc")).rejects.toThrow(/unauthorized_client/);
  });

  it("leaves a transient failure a plain error, which callers may retry", async () => {
    googleReplies(500, { error: "backendError", error_description: "try later" });
    const err = await refreshAccessToken("enc").catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(GmailNotConnectedError);
  });
});
