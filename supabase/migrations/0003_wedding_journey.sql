-- Wedding-first onboarding + journey model.
-- Onboarding now seeds the couple's wedding event; the home hub derives
-- journey stages (basics → venue → vendors → invites) from these facts.

alter table public.profiles
  add column partner_name text,
  add column active_event_id uuid references public.events(id) on delete set null;

alter table public.events
  add column date_precision text not null default 'undecided'
    check (date_precision in ('exact', 'month', 'season', 'undecided')),
  add column date_hint text,                 -- e.g. 'Summer 2027' when not exact
  add column chosen_venue_id uuid references public.venues(id) on delete set null,
  add column journey_overrides jsonb not null default '{}'::jsonb;
