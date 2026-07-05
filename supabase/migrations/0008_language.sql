-- Per-user UI + assistant language preference. Danish is the source language
-- of the app, so it stays the default; English is the alternative.
alter table public.profiles
  add column language text not null default 'da'
    check (language in ('da', 'en'));
