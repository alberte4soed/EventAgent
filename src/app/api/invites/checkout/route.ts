import { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { INVITE_QUANTITIES, orderAmountCents } from "@/lib/invites";

/**
 * POST /api/invites/checkout — create an invite order and a Stripe Checkout
 * Session for it. Body: { eventId, style?, palette?, wording?, quantity }.
 * Returns { url } to redirect the browser to Stripe.
 */
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: "Payments are not configured yet" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    eventId?: string;
    style?: string | null;
    palette?: string | null;
    wording?: string | null;
    quantity?: number;
    designId?: string | null;
  };
  const eventId = body.eventId ?? "";
  const quantity = Number(body.quantity);
  if (!eventId || !INVITE_QUANTITIES.includes(quantity as (typeof INVITE_QUANTITIES)[number])) {
    return Response.json({ error: "eventId and a valid quantity are required" }, { status: 400 });
  }

  // RLS-scoped: confirms the event belongs to this user.
  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

  // A selected design's storage path becomes the (future) Gelato print file.
  let designPath: string | null = null;
  if (body.designId) {
    const { data: design } = await supabase
      .from("invite_designs")
      .select("storage_path")
      .eq("id", body.designId)
      .eq("event_id", eventId)
      .maybeSingle();
    designPath = (design?.storage_path as string | null) ?? null;
  }

  const amountCents = orderAmountCents(quantity);

  const { data: order, error: orderError } = await supabase
    .from("invite_orders")
    .insert({
      event_id: eventId,
      user_id: user.id,
      style: body.style ?? null,
      palette: body.palette ?? null,
      wording: body.wording ?? null,
      quantity,
      design_file_url: designPath,
      amount_cents: amountCents,
      currency: "usd",
      status: "pending_payment",
    })
    .select()
    .single();
  if (orderError || !order) {
    return Response.json({ error: orderError?.message ?? "Could not create order" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const stripe = new Stripe(stripeKey);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Wedding invitations × ${quantity}`,
            description: `${body.style ?? "Custom"} invitation suite for ${event.title}`,
          },
        },
      },
    ],
    metadata: { order_id: order.id, event_id: eventId, user_id: user.id },
    success_url: `${appUrl}/events/${eventId}/invites?checkout=success`,
    cancel_url: `${appUrl}/events/${eventId}/invites?checkout=canceled`,
  });

  await supabase
    .from("invite_orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return Response.json({ url: session.url });
}
