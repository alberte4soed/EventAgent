// Pull vendor attachments (venue pics, brochures, PDFs) out of Gmail replies
// and into Supabase Storage. Best-effort throughout — attachments must never
// break reply ingestion.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailReplyRow } from "@/lib/db/types";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const MAX_ATTACHMENTS_PER_MESSAGE = 10;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MB

interface GmailPart {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
}

export interface AttachmentPart {
  filename: string;
  mimeType: string | null;
  size: number | null;
  attachmentId: string;
}

/** MIME-walk for real attachments (parts with a filename + attachmentId). */
export function collectAttachmentParts(part: GmailPart | undefined): AttachmentPart[] {
  if (!part) return [];
  const found: AttachmentPart[] = [];
  const walk = (p: GmailPart) => {
    if (found.length >= MAX_ATTACHMENTS_PER_MESSAGE) return;
    if (p.filename && p.body?.attachmentId) {
      const size = p.body.size ?? null;
      if (!size || size <= MAX_ATTACHMENT_BYTES) {
        found.push({
          filename: p.filename,
          mimeType: p.mimeType ?? null,
          size,
          attachmentId: p.body.attachmentId,
        });
      }
    }
    for (const child of p.parts ?? []) walk(child);
  };
  walk(part);
  return found;
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim();
  return cleaned || "attachment";
}

/**
 * Download a reply's attachments from Gmail and store them in the private
 * vendor-files bucket + email_attachments table. Returns how many were saved.
 */
export async function saveReplyAttachments(
  accessToken: string,
  admin: SupabaseClient,
  reply: Pick<EmailReplyRow, "id" | "venue_id" | "event_id" | "user_id" | "gmail_message_id">,
  payload: GmailPart | undefined
): Promise<number> {
  const parts = collectAttachmentParts(payload);
  let saved = 0;
  for (const part of parts) {
    try {
      const res = await fetch(
        `${GMAIL_API}/messages/${reply.gmail_message_id}/attachments/${part.attachmentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { data?: string };
      if (!data.data) continue;
      const buffer = Buffer.from(data.data, "base64url");
      if (buffer.length > MAX_ATTACHMENT_BYTES) continue;

      const filename = safeFilename(part.filename);
      const storagePath = `${reply.user_id}/${reply.event_id}/${reply.id}/${filename}`;
      const { error: uploadError } = await admin.storage
        .from("vendor-files")
        .upload(storagePath, buffer, {
          contentType: part.mimeType ?? "application/octet-stream",
          upsert: true,
        });
      if (uploadError) continue;

      const { error: insertError } = await admin.from("email_attachments").insert({
        email_reply_id: reply.id,
        venue_id: reply.venue_id,
        event_id: reply.event_id,
        user_id: reply.user_id,
        filename,
        mime_type: part.mimeType,
        size_bytes: part.size ?? buffer.length,
        storage_path: storagePath,
      });
      if (!insertError) saved++;
    } catch {
      // best-effort per attachment
    }
  }
  return saved;
}
