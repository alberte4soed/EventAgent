-- HTML-built sites: the design pipeline now generates the site's full HTML
-- (sanitized, alias-imaged) in a dedicated column, and Nano Banana section
-- illustrations are stored per section so they're generated once and reused
-- across builds.

-- 1. The generated site markup. design (jsonb) keeps meta: preset, brief,
--    summary, referenced image ids. Rows without html fall back to the
--    token renderer (templates / pre-HTML designs).
alter table public.website_designs add column html text;

-- 2. Per-section generated imagery: role 'section' + which section it's for.
alter table public.site_photos drop constraint site_photos_role_check;
alter table public.site_photos add constraint site_photos_role_check
  check (role in ('hero', 'gallery', 'section'));
alter table public.site_photos add column section text;
create index site_photos_section_idx on public.site_photos(event_id, section)
  where section is not null;
