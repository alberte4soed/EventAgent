-- The attributes couples actually decide on, beyond capacity and price.
--
-- Two sources, kept apart on purpose:
--
--   ceremony / outdoor / rain_plan / own_drinks / exclusive / curfew_hour
--     are INFERRED — Gemini reading a venue's own pages. Often unknown, and
--     "unknown" is a first-class answer: the search badges it rather than
--     hiding the venue.
--
--   wheelchair / parking / good_for_children / allows_dogs are FACT, straight
--     from Google Places. Null means Google said nothing, never "no".
--
-- Why these six inferred fields: Danish venue checklists put "hvor længe må
-- festen vare", "må vi medbringe egne drikkevarer" and "deles stedet med
-- andre" in their top ten questions, and no international venue site filters
-- on any of them. "Vielse på stedet" is a legal question here, not a nicety.

alter table public.venues
  add column ceremony text,
  add column outdoor text,
  add column rain_plan boolean,
  add column own_drinks text,
  add column exclusive text,
  -- The hour the party must end, 24h clock: 1 = 01:00.
  add column curfew_hour int,
  -- Google-reported. Null = Google has no data, not "no".
  add column wheelchair boolean,
  add column parking text,
  add column good_for_children boolean,
  add column allows_dogs boolean;

alter table public.venues
  add constraint venues_ceremony_check
    check (ceremony is null or ceremony in ('on_site', 'outdoor', 'none', 'unknown')),
  add constraint venues_outdoor_check
    check (outdoor is null or outdoor in ('garden', 'terrace', 'none', 'unknown')),
  add constraint venues_own_drinks_check
    check (own_drinks is null or own_drinks in ('allowed', 'corkage', 'not_allowed', 'unknown')),
  add constraint venues_exclusive_check
    check (exclusive is null or exclusive in ('sole_use', 'shared', 'unknown')),
  add constraint venues_curfew_check
    check (curfew_hour is null or (curfew_hour >= 0 and curfew_hour <= 23)),
  add constraint venues_parking_check
    check (parking is null or parking in ('free', 'paid', 'street'));
