// Gmail label management for the platform mailbox — the "tag on our side"
// organization. Best-effort throughout: labels must never break a send.

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const labelIdCache = new Map<string, string>();

interface GmailLabel {
  id: string;
  name: string;
}

/** Find-or-create a label by name; null on any failure. */
export async function ensureLabel(
  accessToken: string,
  name: string
): Promise<string | null> {
  const cached = labelIdCache.get(name);
  if (cached) return cached;
  try {
    const listRes = await fetch(`${GMAIL_API}/labels`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listRes.ok) {
      const data = (await listRes.json()) as { labels?: GmailLabel[] };
      const existing = data.labels?.find((l) => l.name === name);
      if (existing) {
        labelIdCache.set(name, existing.id);
        return existing.id;
      }
    }
    const createRes = await fetch(`${GMAIL_API}/labels`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    });
    if (!createRes.ok) return null;
    const created = (await createRes.json()) as GmailLabel;
    labelIdCache.set(name, created.id);
    return created.id;
  } catch {
    return null;
  }
}

/** Apply labels to a thread; silently ignores failures. */
export async function applyLabels(
  accessToken: string,
  threadId: string,
  labelIds: (string | null)[]
): Promise<void> {
  const ids = labelIds.filter((id): id is string => Boolean(id));
  if (ids.length === 0) return;
  try {
    await fetch(`${GMAIL_API}/threads/${threadId}/modify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addLabelIds: ids }),
    });
  } catch {
    // best-effort
  }
}

/** Tag an outreach thread with the kalas + per-event labels. */
export async function labelOutreachThread(
  accessToken: string,
  threadId: string,
  replyTag: string
): Promise<void> {
  const [base, tagged] = await Promise.all([
    ensureLabel(accessToken, "kalas"),
    ensureLabel(accessToken, `kalas/${replyTag}`),
  ]);
  await applyLabels(accessToken, threadId, [base, tagged]);
}
