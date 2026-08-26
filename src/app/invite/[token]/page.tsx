import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /invite/<token> — where the link in Ava's partner invitation lands.
 *
 * Today it records that the invitation was opened and hands the partner to
 * signup; there is nothing else it can honestly do, because a second user
 * cannot yet see someone else's wedding (RLS is `auth.uid() = user_id` on
 * every table). When membership lands this is the accept flow: match the
 * signed-up user to the invite, write the event_members row, mark accepted.
 *
 * Service-role by necessity — the recipient is not signed in, and the RLS
 * policy on partner_invites answers to the inviter, not to them.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data } = await admin
    .from("partner_invites")
    .select("id, status")
    .eq("token", token)
    .maybeSingle();

  // An unknown or spent token is not worth an error page: signup is where an
  // invited partner needs to end up regardless, and saying "no such invite"
  // to an anonymous visitor only confirms which tokens are live.
  if (data && data.status === "sent") {
    await admin
      .from("partner_invites")
      .update({ status: "opened", opened_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  redirect("/login?invited=1");
}
