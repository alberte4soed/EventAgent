-- AI-designed wedding websites: Ava generates each couple a bespoke site
-- design (structured tokens + copy, rendered by SiteRenderer) instead of
-- the old template pickers. Photos are couple uploads or Ava-generated
-- artwork; the feature is unlocked by a one-time Stripe purchase.

-- 1. Generated site designs — versioned; exactly one active per event.
create table public.website_designs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  brief jsonb not null default '{}'::jsonb,  -- intake: style direction, vibes, refinement instruction
  design jsonb not null,                     -- SiteDesign blob (validated by parseSiteDesign)
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create index website_designs_event_idx on public.website_designs(event_id);
create unique index website_designs_one_active
  on public.website_designs(event_id) where active;

-- 2. Site photos — couple uploads plus Ava-generated decorative imagery.
create table public.site_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null, -- {user_id}/{event_id}/{id}.{ext} in site-photos
  kind text not null default 'upload' check (kind in ('upload', 'generated')),
  role text not null default 'gallery' check (role in ('hero', 'gallery')),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index site_photos_event_idx on public.site_photos(event_id);

-- 3. Website orders — Stripe purchase unlocking the AI designer (+ branding removal).
create table public.website_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents int,
  currency text not null default 'dkk',
  stripe_session_id text,
  stripe_payment_intent text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'canceled')),
  created_at timestamptz not null default now()
);
create index website_orders_event_idx on public.website_orders(event_id);

-- RLS: own rows (same pattern as 0001). The Stripe webhook writes via the
-- service-role client, so no anon/webhook policies are needed.
alter table public.website_designs enable row level security;
alter table public.site_photos enable row level security;
alter table public.website_orders enable row level security;
create policy "own website_designs" on public.website_designs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own site_photos" on public.site_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own website_orders" on public.website_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime so the builder live-updates when Ava saves a design mid-chat.
alter publication supabase_realtime add table public.website_designs;
alter publication supabase_realtime add table public.site_photos;

-- Storage: private bucket; owner-read via path prefix = user_id.
-- Writes go through the service-role client only (no insert policies).
-- Guests see photos through per-request signed URLs minted in /w/[slug].
insert into storage.buckets (id, name, public) values
  ('site-photos', 'site-photos', false)
on conflict (id) do nothing;

create policy "own site photos" on storage.objects for select
  using (bucket_id = 'site-photos' and (storage.foldername(name))[1] = auth.uid()::text);
