-- Google Places enrichment for venue (and later vendor) research.
-- place_id enables dedupe; rating/reviews/photos come from Place Details;
-- contact_verified means the email domain matches the Places website.
-- category prepares the table for non-venue vendors (florists, photographers…).

alter table public.venues
  add column place_id text,
  add column rating numeric(2,1),
  add column review_count int,
  add column reviews jsonb not null default '[]'::jsonb,    -- top 3 {author, rating, text, relative_time}
  add column photo_urls jsonb not null default '[]'::jsonb, -- up to 4 public photo URIs
  add column lat double precision,
  add column lng double precision,
  add column price_level text,
  add column business_status text,
  add column why_fit text,
  add column contact_verified boolean not null default false,
  add column category text not null default 'venue'
    check (category in ('venue', 'florist', 'photographer', 'musician', 'caterer', 'planner', 'other'));

-- One row per real-world place per event, across repeated searches.
create unique index venues_event_place_uniq on public.venues(event_id, place_id)
  where place_id is not null;
