-- Honeymoon saves: the couple's favourited honeymoon destinations, hotels and
-- ideas from the Honeymoon screen (globe explorer + inspiration gallery). These
-- are simple user-owned records with no server-side side effects, so the browser
-- client writes them directly under the same `own` RLS pattern as 0001/0007.

create table public.honeymoon_saves (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                    -- 'destination' | 'hotel' | 'idea'
  name text not null,
  location text,                         -- city / country / region label
  blurb text,                            -- one warm sentence
  image_url text,                        -- Places photo, when available
  place_id text,                         -- Google Places id, for de-duping
  rating numeric,
  meta jsonb not null default '{}'::jsonb, -- extra fields (price_hint, theme, photos…)
  created_at timestamptz not null default now()
);
create index honeymoon_saves_event_idx on public.honeymoon_saves(event_id);

-- RLS: own rows (same pattern as 0001/0007).
alter table public.honeymoon_saves enable row level security;
create policy "own honeymoon_saves" on public.honeymoon_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime so multiple devices/tabs stay in sync while browsing.
alter publication supabase_realtime add table public.honeymoon_saves;
