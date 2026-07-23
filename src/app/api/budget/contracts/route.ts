import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BudgetContractRow } from "@/lib/db/types";

export const maxDuration = 60;

const BUCKET = "budget-contracts";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per contract
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
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

async function signContract(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** GET /api/budget/contracts?eventId=…[&category=…] — contracts with signed URLs. */
export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get("eventId") ?? "";
  const category = request.nextUrl.searchParams.get("category") ?? "";
  if (!eventId) return Response.json({ error: "eventId is required" }, { status: 400 });

  let query = supabase.from("budget_contracts").select("*").eq("event_id", eventId);
  if (category) query = query.eq("category", category);
  const { data } = await query.order("created_at", { ascending: false });
  const rows = (data ?? []) as BudgetContractRow[];

  const contracts = await Promise.all(
    rows.map(async (c) => ({ ...c, url: await signContract(c.storage_path) }))
  );
  return Response.json({ contracts });
}

/** POST /api/budget/contracts — upload a contract (multipart: file + eventId + category). */
export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const eventId = typeof form?.get("eventId") === "string" ? (form.get("eventId") as string) : "";
  const category = typeof form?.get("category") === "string" ? (form.get("category") as string) : "";
  if (!(file instanceof File) || !eventId || !category) {
    return Response.json({ error: "file, eventId and category are required" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) return Response.json({ error: "Kun PDF, JPEG, PNG eller WebP" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Filen er for stor (max 15 MB)" }, { status: 413 });

  // Ownership via RLS: the select only returns the event if it's the user's.
  const { data: ev } = await supabase.from("events").select("id").eq("id", eventId).maybeSingle();
  if (!ev) return Response.json({ error: "Event not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const storagePath = `${user.id}/${eventId}/${id}.${ext}`;
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: row, error: insertError } = await admin
    .from("budget_contracts")
    .insert({
      id,
      event_id: eventId,
      user_id: user.id,
      category,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storagePath,
    })
    .select()
    .single();
  if (insertError || !row) {
    await admin.storage.from(BUCKET).remove([storagePath]);
    return Response.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
  }

  return Response.json({ contract: { ...(row as BudgetContractRow), url: await signContract(storagePath) } });
}

/** DELETE /api/budget/contracts?id=… — remove a contract and its stored file. */
export async function DELETE(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const { data: row } = await supabase.from("budget_contracts").select("*").eq("id", id).maybeSingle();
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([(row as BudgetContractRow).storage_path]);
  await supabase.from("budget_contracts").delete().eq("id", id);
  return Response.json({ ok: true });
}
