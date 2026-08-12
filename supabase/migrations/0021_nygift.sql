-- Nygift: the post-wedding screen.
--
-- Three additions, one migration, so the live schema changes once even though
-- the feature ships in phases:
--   1. thank_yous  — the couple's annotations on who has been thanked
--   2. album_photos — photos guests upload after the day
--   3. venues.own_* — the couple's own rating of a vendor they booked

-- 1. Thank-you overlay. Sparse: a row exists only once the couple touches an
--    entry. The list itself is DERIVED at render time from guests +
--    registry_claims; this table records only the couple's annotations, so it
--    stays valid when a guest or a claim is deleted (label is denormalized).
--
--    Why an overlay and not guests.thanked_at: registry_claims is select-only
--    for the couple (0009_guest_layer.sql), so the client cannot write there
--    at all, and gift-givers frequently match no guest row.
create table public.thank_yous (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  -- 'guest:<uuid>' | 'claim:<uuid>' | 'manual:<uuid>' — see nygift/thanks.ts
  subject_key text not null,
  label text not null,
  gift text,
  thanked_at timestamptz,
  method text,
  note text,
  created_at timestamptz not null default now(),
  unique (event_id, subject_key),
  constraint thank_yous_method_check
    check (method is null or method in ('kort', 'besked', 'personligt', 'ringet'))
);
create index thank_yous_event_idx on public.thank_yous(event_id);

alter table public.thank_yous enable row level security;
create policy "own thank_yous" on public.thank_yous
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter publication supabase_realtime add table public.thank_yous;

-- 2. Guest album. Deliberately NOT site_photos: guests have no auth.users id,
--    site_photos is capped at 24/event for the website builder, and it feeds
--    Ava's designer. user_id here is the COUPLE (for RLS select); uploads
--    arrive through the service role like RSVP does.
--
--    Objects live in the existing private 'site-photos' bucket under
--    {user_id}/album/{event_id}/{id}.{ext}, so the storage select policy from
--    0012 (foldername[1] = auth.uid()) applies unchanged.
create table public.album_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  uploader_name text,
  guest_id uuid references public.guests(id) on delete set null,
  caption text,
  -- Guests only ever see their own uploads, so there is nothing to moderate.
  -- This column is here for a later "share the album back" phase.
  status text not null default 'visible',
  favorite boolean not null default false,
  bytes int,
  width int,
  height int,
  -- HMAC(ip + ':' + slug) keyed by the service key. Never the raw IP; the
  -- per-slug salt also stops correlating the same guest across weddings.
  uploader_hash text,
  created_at timestamptz not null default now(),
  constraint album_photos_status_check check (status in ('visible', 'hidden'))
);
create index album_photos_event_idx on public.album_photos(event_id, created_at desc);
create index album_photos_rate_idx  on public.album_photos(uploader_hash, created_at desc);

alter table public.album_photos enable row level security;
-- The couple reads and curates; guests write only through the service role.
create policy "own album_photos" on public.album_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- DELIBERATELY not added to supabase_realtime: forty guests uploading during
-- dinner would firehose the couple's open tab. The album tab refetches.

-- 3. The couple's own rating of a vendor they booked. venues.reviews is
--    read-only inbound Google Places data, hence the own_ prefix.
alter table public.venues
  add column if not exists own_rating int,
  add column if not exists own_review text,
  add column if not exists own_reviewed_at timestamptz,
  add column if not exists own_recommend boolean;

alter table public.venues drop constraint if exists venues_own_rating_check;
alter table public.venues
  add constraint venues_own_rating_check
  check (own_rating is null or (own_rating between 1 and 5));
