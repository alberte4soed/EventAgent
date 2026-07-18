-- Tag-based inbound matching: a vendor reply can now arrive in a brand-new
-- Gmail thread and be attributed via the event's plus-address reply_tag, so
-- the outbound anchor becomes optional. venue_id stays NOT NULL: the poller
-- only inserts replies it can pin to a vendor; unresolvable tagged mail is
-- labeled kalas/unmatched in the mailbox for manual triage.

alter table public.email_replies
  alter column outbound_email_id drop not null;

alter table public.email_replies
  add column matched_via text not null default 'thread'
    check (matched_via in ('thread', 'tag', 'sender'));
