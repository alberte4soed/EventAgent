-- Guest-facing layer: publish the wedding website to a public URL, let guests
-- submit RSVPs, and add a gift registry guests can reserve from. Guest writes
-- (RSVP, registry claims) come through service-role API routes — there are no
-- anon RLS policies; the couple owns and reads everything under the usual
-- `own` pattern.

-- 1. One published site per slug (case-insensitive). Only enforced when set.
create unique index wedding_sites_domain_key
  on public.wedding_sites (lower(domain)) where domain is not null;

-- 2. Guest RSVP details + a stable per-guest token for personal invite links.
alter table public.guests
  add column dietary text,
  add column plus_one_name text,
  add column responded_at timestamptz,
  add column rsvp_token uuid not null default gen_random_uuid();
create unique index guests_rsvp_token_key on public.guests(rsvp_token);

-- 3. Gift registry the couple manages; renders as a section of the public site.
create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  product_url text,
  store_name text,
  price_cents int,
  currency text not null default 'DKK',
  quantity int not null default 1,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index registry_items_event_idx on public.registry_items(event_id);

-- 4. A guest reserving a gift (inserted via service role from the public site).
create table public.registry_claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.registry_items(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, -- couple, for RLS select
  guest_name text not null,
  guest_email text,
  message text,
  quantity int not null default 1,
  created_at timestamptz not null default now()
);
create index registry_claims_item_idx on public.registry_claims(item_id);
create index registry_claims_event_idx on public.registry_claims(event_id);

-- 5. Persisted moodboard uploads / imported images live in Supabase Storage.
alter table public.moodboard_items add column storage_path text;

-- RLS: couple owns registry_items fully; can only READ claims (guests write
-- them through the service role, which bypasses RLS).
alter table public.registry_items enable row level security;
alter table public.registry_claims enable row level security;
create policy "own registry_items" on public.registry_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read own registry_claims" on public.registry_claims
  for select using (auth.uid() = user_id);

-- Realtime so the couple sees new claims (and their own edits) live.
alter publication supabase_realtime add table public.registry_items;
alter publication supabase_realtime add table public.registry_claims;

-- Storage: private moodboard bucket; owner-read via path prefix = user_id.
-- Writes go through the service-role client only (no insert policy).
insert into storage.buckets (id, name, public) values
  ('moodboard', 'moodboard', false)
on conflict (id) do nothing;

create policy "own moodboard files" on storage.objects for select
  using (bucket_id = 'moodboard' and (storage.foldername(name))[1] = auth.uid()::text);
