-- Planning tables: the couple's own editable data for the budget, guest list,
-- timeline, moodboard, wedding website and seating plan. These are simple
-- user-owned records with no server-side side effects, so the browser client
-- writes them directly under the same `own` RLS pattern as 0001.

-- 1. Budget line items (Ava's allocation the couple then tunes).
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,               -- benchmark id: venue, catering, photo, …
  label text not null,
  planned_amount int not null default 0, -- DKK
  paid_amount int not null default 0,    -- DKK already paid
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index budget_items_event_idx on public.budget_items(event_id);

-- 2. Guest list + RSVP.
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  side text not null default 'Fælles',
  email text,
  phone text,
  rsvp text not null default 'afventer'
    check (rsvp in ('afventer', 'ja', 'nej')),
  meal text,
  plus_one boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index guests_event_idx on public.guests(event_id);

-- 3. Timeline milestones (previously client-only mock state).
create table public.timeline_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  category text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index timeline_tasks_event_idx on public.timeline_tasks(event_id);

-- 4. Moodboard: saved inspiration images.
create table public.moodboard_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_key text,                       -- mock IMAGES key, when picked from the deck
  image_url text,                       -- external URL, when uploaded/linked
  note text,
  created_at timestamptz not null default now()
);
create index moodboard_items_event_idx on public.moodboard_items(event_id);

-- 5. Wedding website config (one holistic row per event).
create table public.wedding_sites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb, -- design + content builder state
  domain text,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

-- 6. Seating plan (one holistic row per event: tables + assignments).
create table public.seating_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS: own rows (same pattern as 0001).
alter table public.budget_items enable row level security;
alter table public.guests enable row level security;
alter table public.timeline_tasks enable row level security;
alter table public.moodboard_items enable row level security;
alter table public.wedding_sites enable row level security;
alter table public.seating_plans enable row level security;

create policy "own budget_items" on public.budget_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own guests" on public.guests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own timeline_tasks" on public.timeline_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own moodboard_items" on public.moodboard_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own wedding_sites" on public.wedding_sites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own seating_plans" on public.seating_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime so multiple devices/tabs stay in sync while planning.
alter publication supabase_realtime add table public.budget_items;
alter publication supabase_realtime add table public.guests;
alter publication supabase_realtime add table public.timeline_tasks;
alter publication supabase_realtime add table public.moodboard_items;
alter publication supabase_realtime add table public.wedding_sites;
alter publication supabase_realtime add table public.seating_plans;
