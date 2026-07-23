-- 0014_invitations.sql — digital invitations (template → customize → share).
-- A couple builds a digital invitation from one of the 20 templates and shares
-- it at /i/<slug>. RSVPs are written to the existing `guests` table via a
-- service-role route (mirroring the /w website RSVP), so this migration adds no
-- RSVP table of its own.

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  template_id text not null,
  data jsonb not null default '{}',
  slug text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_event_idx on public.invitations(event_id);

-- Unique share slug (case-insensitive), enforced only for published/named rows.
create unique index if not exists invitations_slug_key
  on public.invitations (lower(slug)) where slug is not null;

alter table public.invitations enable row level security;

-- The couple owns their invitations. Public reads (the share page) and guest
-- RSVP writes go through the service-role client, which bypasses RLS.
create policy "own invitations" on public.invitations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep the couple's dashboard fresh across tabs/devices.
alter publication supabase_realtime add table public.invitations;
