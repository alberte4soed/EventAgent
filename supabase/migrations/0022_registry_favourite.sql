-- "Ønskes mest": the couple can star a handful of gifts so they sort to the
-- top of the grid, on their own screen and on the guest-facing site.
--
-- Nullable would have been ambiguous ("not starred" vs "never asked"), and the
-- registry has no such distinction — every existing row is simply not starred.
-- RLS and realtime need no change: the `own registry_items` policy in
-- 0009_guest_layer.sql is `for all using (auth.uid() = user_id)`, and the table
-- is already in the supabase_realtime publication.

alter table public.registry_items
  add column if not exists favourite boolean not null default false;

-- Favourites first, then the couple's own order. Matches sortGifts() in
-- src/kalas/registry/gifts.ts, which sorts the same rows client-side.
create index if not exists registry_items_event_favourite_idx
  on public.registry_items (event_id, favourite desc, sort);
