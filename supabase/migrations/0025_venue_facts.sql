-- Structured venue facts.
--
-- `capacity` and `price_hint` are free text ("Op til 140 gæster", "62.000 kr"),
-- which is fine to read and impossible to filter — so the couple's guest count
-- and budget had no effect on venue search at all. These columns carry the
-- same information as numbers and enums, filled in by the search pipeline and
-- corrected by the per-venue research pass.
--
-- Every column is nullable, and the text columns above are kept: non-venue
-- vendors (florists, photographers) have no capacity or catering, and existing
-- rows predate all of this. "Unknown" is a real, expected state — the search
-- badges it rather than hiding the venue.

alter table public.venues
  add column capacity_seated int,
  add column capacity_standing int,
  -- Lowest published price in the venue's local currency, and what it buys.
  add column price_from int,
  add column price_unit text,
  add column catering text,
  add column accommodation text,
  -- Rooms on site, only meaningful when accommodation = 'on_site'.
  add column rooms int,
  add column setting text,
  -- The area the venue was found in, e.g. "Helsingør". Free text, not a
  -- foreign key: the region taxonomy lives in the app and will be edited.
  add column region text;

alter table public.venues
  add constraint venues_price_unit_check
    check (price_unit is null or price_unit in ('total', 'per_guest')),
  add constraint venues_catering_check
    check (catering is null or catering in ('in_house', 'external_allowed', 'own_food_allowed', 'unknown')),
  add constraint venues_accommodation_check
    check (accommodation is null or accommodation in ('on_site', 'nearby', 'none', 'unknown'));

-- The capacity filter is the one hard filter in venue search, so it runs on
-- every shortlist read. Partial: rows without a capacity are never scanned by
-- a "fits N guests" query, they are kept by the unknown-passes rule instead.
create index venues_capacity_idx on public.venues(event_id, capacity_seated)
  where capacity_seated is not null;
