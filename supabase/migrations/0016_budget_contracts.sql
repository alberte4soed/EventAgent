-- Budget contracts: a vendor contract (PDF/image) uploaded against a budget
-- line, plus Ava's (Gemini) structured review stored alongside. Linked by
-- (event_id, category) — the same category key the budget UI uses, so a
-- contract can attach before the budget_items row has a stable id.
-- Private storage bucket; owner-read by the user_id path prefix; writes go
-- through the service-role client only (no insert storage policy), same as 0006.

create table public.budget_contracts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,          -- budget line id: venue, photo, catering, …
  filename text not null,
  mime_type text,
  size_bytes int,
  storage_path text not null,      -- {user_id}/{event_id}/{id}.{ext} in budget-contracts
  review jsonb,                    -- Ava's structured review (null until analysed)
  created_at timestamptz not null default now()
);
create index budget_contracts_event_idx on public.budget_contracts(event_id);
create index budget_contracts_cat_idx on public.budget_contracts(event_id, category);

alter table public.budget_contracts enable row level security;
create policy "own budget_contracts" on public.budget_contracts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.budget_contracts;

insert into storage.buckets (id, name, public) values
  ('budget-contracts', 'budget-contracts', false)
on conflict (id) do nothing;

create policy "own budget contracts" on storage.objects for select
  using (bucket_id = 'budget-contracts' and (storage.foldername(name))[1] = auth.uid()::text);
