import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

const BUCKET = "invite-designs";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * GET /api/invites/photo?path=… — sign an already-uploaded invite photo so the
 * builder can preview it after a reload. Only the caller's own files (path
 * prefixed with their user id) can be signed.
 */
export async function GET(request: NextRequest) {
  const { user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!path || !path.startsWith(`${user.id}/`)) {
    return Response.json({ error: "path is required" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  return Response.json({ url: data?.signedUrl ?? null });
}

/**
 * POST /api/invites/photo — upload the couple photo shown on the online
 * invitation (multipart: file + eventId). Stored privately in the invite-designs
 * bucket; the returned `path` is saved into invitations.config.photoPath and the
 * public page mints a fresh signed URL per request.
 */
export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const eventId = typeof form?.get("eventId") === "string" ? (form.get("eventId") as string) : "";
  if (!(file instanceof File) || !eventId) {
    return Response.json({ error: "file and eventId are required" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) return Response.json({ error: "Kun JPEG, PNG eller WebP" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Billedet er for stort (max 8 MB)" }, { status: 413 });

  // Ownership via RLS: the select only returns the event if it's the user's.
  const { data: ev } = await supabase.from("events").select("id").eq("id", eventId).maybeSingle();
  if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const path = `${user.id}/${eventId}/hero-${id}.${ext}`;
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  return Response.json({ path, url: signed?.signedUrl ?? null });
}
