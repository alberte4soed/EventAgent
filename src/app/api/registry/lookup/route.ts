import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupProduct } from "@/lib/og";

/**
 * POST /api/registry/lookup — fetch product metadata (title/image/price/store)
 * for a pasted URL so the couple can add a registry item with one click.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = (await request.json()) as { url?: string };
  if (!url?.trim()) return Response.json({ error: "url is required" }, { status: 400 });

  const info = await lookupProduct(url.trim());
  return Response.json(info);
}
