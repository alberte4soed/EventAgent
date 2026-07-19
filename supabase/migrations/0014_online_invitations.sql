-- Online invitations: a shareable digital invitation (envelope reveal → card →
-- RSVP) per event. Distinct from the full wedding site (wedding_sites) — this is
-- a single, template-driven invitation the couple shares by link. Guest RSVPs
-- reuse the existing `guests` table + rsvp_token (personal links) through
-- service-role API routes; there are no anon RLS policies, matching the site.

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text,
  config jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create index invitations_event_idx on public.invitations(event_id);

-- One published invitation per slug (case-insensitive). Only enforced when set.
create unique index invitations_slug_key
  on public.invitations (lower(slug)) where slug is not null;

alter table public.invitations enable row level security;

create policy "own invitations" on public.invitations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime so the builder reconciles across tabs.
alter publication supabase_realtime add table public.invitations;
