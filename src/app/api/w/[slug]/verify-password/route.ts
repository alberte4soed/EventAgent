import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteCookieName, siteCookieValue } from "@/lib/site-auth";
import type { WeddingSiteRow } from "@/lib/db/types";

/**
 * POST /api/w/[slug]/verify-password — checks a password-protected site's code
 * server-side and, on success, sets a signed httpOnly cookie granting access.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { password } = (await request.json()) as { password?: string };

  const admin = createAdminClient();
  const { data: siteRow } = await admin
    .from("wedding_sites").select("config, published").ilike("domain", slug).maybeSingle();
  const site = siteRow as Pick<WeddingSiteRow, "config" | "published"> | null;
  if (!site || !site.published) return Response.json({ error: "Site not found" }, { status: 404 });

  const stored = typeof site.config?.sitePassword === "string" ? (site.config.sitePassword as string) : "";
  if (!stored || password !== stored) {
    return Response.json({ error: "wrong_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(siteCookieName(slug), siteCookieValue(slug, stored), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: `/w/${slug}`, maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
