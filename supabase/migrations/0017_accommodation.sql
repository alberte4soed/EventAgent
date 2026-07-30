-- Accommodation vendor category — "Overnatning" page (hotels & places for
-- guests to stay near the wedding). Extends the category check constraints on
-- venues and email_drafts (both were created inline, so Postgres auto-named
-- them <table>_category_check).

alter table public.venues drop constraint venues_category_check;
alter table public.venues add constraint venues_category_check
  check (category in ('venue', 'florist', 'photographer', 'musician', 'caterer', 'planner', 'accommodation', 'other'));

alter table public.email_drafts drop constraint email_drafts_category_check;
alter table public.email_drafts add constraint email_drafts_category_check
  check (category in ('venue', 'florist', 'photographer', 'musician', 'caterer', 'planner', 'accommodation', 'other'));
