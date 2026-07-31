-- Split timeline_tasks into two levels of detail:
--   'milestone' — the ~14 big, date-anchored steps shown on the Tidslinje tab
--   'check'     — the many small to-dos shown on the Tjekliste tab, grouped by area
--
-- Existing rows are all milestones, so the default classifies them correctly
-- and no backfill is needed.
--
-- Note the asymmetry in `category`: on milestones it still carries the
-- 'wedding_day' sentinel (left as-is, no data migration); on check rows it
-- carries the area id ('venue', 'mad', 'stil', …). `kind` is what separates
-- the two tabs — never `category`.

alter table public.timeline_tasks
  add column if not exists kind text not null default 'milestone';

alter table public.timeline_tasks
  drop constraint if exists timeline_tasks_kind_check;

alter table public.timeline_tasks
  add constraint timeline_tasks_kind_check check (kind in ('milestone', 'check'));

create index if not exists timeline_tasks_event_kind_idx
  on public.timeline_tasks(event_id, kind, sort);
