-- 0024_partner_invites.sql — the partner invitation Ava actually sends.
--
-- Until now the onboarding step flipped a local boolean and claimed an email
-- had gone out. This table is the record behind the real send: one row per
-- (couple, invited address), carrying the token the link in the email resolves.
--
-- `event_id` is nullable on purpose. The invite is offered on the last
-- onboarding step, which runs *before* /api/onboarding creates the event row,
-- so the invite is minted against the inviting user and adopted by the event
-- afterwards. A row that never gets an event still records who was asked.
--
-- Shared access does not exist yet — every table is `auth.uid() = user_id`
-- (0001_init.sql) and there is no membership table — so `accepted` is written
-- but nothing yet grants the partner sight of the wedding. That is the next
-- piece, and it slots in here: an event_members row keyed on accepted_by.

create table if not exists public.partner_invites (
  id uuid primary key default gen_random_uuid(),
  -- The inviting half of the couple.
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  email text not null,
  -- URL-safe, 32 chars of base64url. Unguessable: it is the only thing
  -- standing between a leaked link and the invitation it opens.
  token text not null unique,
  status text not null default 'sent' check (status in ('sent','opened','accepted','revoked')),
  -- Set when the partner completes signup — the hook the membership work needs.
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz
);

create index if not exists partner_invites_user_idx on public.partner_invites(user_id);
create index if not exists partner_invites_event_idx on public.partner_invites(event_id);

-- One live invite per address per couple: re-sending refreshes the row (and
-- mints a fresh token) rather than littering the table with dead invitations.
--
-- Plain columns, not lower(email): an upsert has to name this index as its
-- conflict target, and an expression index cannot be named that way. The route
-- lowercases the address before it is stored, which is what makes the plain
-- index behave case-insensitively.
create unique index if not exists partner_invites_user_email_key
  on public.partner_invites (user_id, email);

alter table public.partner_invites enable row level security;

-- The inviter owns the row. Token lookups happen in /invite/<token>, which
-- runs service-role: the recipient is not signed in yet and, once they are,
-- is not the owner — neither can pass this policy.
create policy "own partner_invites" on public.partner_invites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
