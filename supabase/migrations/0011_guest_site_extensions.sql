-- Guest-site extensions: per-sub-event RSVP answers + custom questions,
-- on-site accommodation (rooms guests reserve from the RSVP flow, with a
-- DB-enforced capacity guard + waitlist), guest photo sharing, and cash
-- gifts (pengeønsker/MobilePay) in the registry. Same access model as 0009:
-- the couple owns everything under `own` RLS; guest writes come through
-- service-role API routes only.

-- 1. RSVP extension: answers per sub-event (vielse/fest/brunch — defined in
-- wedding_sites.config), couple-defined custom questions, children count.
alter table public.guests
  add column rsvp_events jsonb not null default '{}'::jsonb,     -- {subEventId: bool}
  add column custom_answers jsonb not null default '{}'::jsonb,  -- {questionId: text}
  add column children_count int not null default 0 check (children_count >= 0);

-- 2. On-site accommodation (level B): the couple creates rooms/beds, guests
-- reserve spots first-come-first-served with a waitlist.
create table public.accommodation_rooms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                       -- "Værelse 1: dobbeltseng"
  description text,
  capacity int not null check (capacity > 0),
  price_per_spot_cents int,
  currency text not null default 'DKK',
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index accommodation_rooms_event_idx on public.accommodation_rooms(event_id);

create table public.accommodation_reservations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.accommodation_rooms(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, -- couple, for RLS
  guest_id uuid references public.guests(id) on delete set null,
  guest_name text not null,
  guest_email text,
  spots int not null default 1 check (spots > 0),
  status text not null default 'confirmed' check (status in ('confirmed','waitlist')),
  created_at timestamptz not null default now()
);
create index accommodation_res_room_idx on public.accommodation_reservations(room_id);
create index accommodation_res_event_idx on public.accommodation_reservations(event_id);

-- Overbooking guard: FOR UPDATE on the room row serializes concurrent
-- writers; runs on insert AND update so manual reassignment re-validates.
create function public.check_room_capacity() returns trigger
language plpgsql as $$
declare cap int; taken int;
begin
  if new.status <> 'confirmed' then return new; end if;
  select capacity into cap from public.accommodation_rooms
    where id = new.room_id for update;
  select coalesce(sum(spots), 0) into taken from public.accommodation_reservations
    where room_id = new.room_id and status = 'confirmed' and id <> new.id;
  if taken + new.spots > cap then
    raise exception 'room_full';
  end if;
  return new;
end $$;
create trigger accommodation_capacity_check
  before insert or update on public.accommodation_reservations
  for each row execute function public.check_room_capacity();

-- 3. Photo sharing: couple's pre-day photos + guests' uploads (no login;
-- consent_at records the GDPR checkbox). Files live in the private
-- 'site-photos' bucket; the public site serves signed URLs.
create table public.site_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  uploader_name text,
  storage_path text not null,
  content_type text,
  size_bytes int,
  uploaded_by text not null default 'guest' check (uploaded_by in ('guest','couple')),
  hidden boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
create index site_photos_event_idx on public.site_photos(event_id);

-- 4. Cash gifts (pengeønsker): rendered as a MobilePay box, not claimable.
alter table public.registry_items
  add column kind text not null default 'gift' check (kind in ('gift','cash')),
  add column mobilepay_number text;

-- RLS: couple full access; guests write via the service role (bypasses RLS).
alter table public.accommodation_rooms enable row level security;
alter table public.accommodation_reservations enable row level security;
alter table public.site_photos enable row level security;
create policy "own accommodation_rooms" on public.accommodation_rooms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own accommodation_reservations" on public.accommodation_reservations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own site_photos" on public.site_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime so the couple's dashboard tracks reservations and uploads live.
alter publication supabase_realtime add table public.accommodation_rooms;
alter publication supabase_realtime add table public.accommodation_reservations;
alter publication supabase_realtime add table public.site_photos;

-- Storage: private bucket for guest/couple photos and the uploaded monogram.
-- Owner-read via path prefix = user_id (same pattern as 'moodboard'); all
-- writes go through service-role/authed API routes (no insert policy).
insert into storage.buckets (id, name, public) values
  ('site-photos', 'site-photos', false)
on conflict (id) do nothing;

create policy "own site-photos files" on storage.objects for select
  using (bucket_id = 'site-photos' and (storage.foldername(name))[1] = auth.uid()::text);
