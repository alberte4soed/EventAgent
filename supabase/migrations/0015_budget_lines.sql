-- Budget line expansion: each budget_items row becomes a small workspace.
-- Adds the "faktisk pris" (agreed cost) distinct from the estimate
-- (planned_amount) and the amount already paid (paid_amount), plus a free-text
-- note and an in-app reminder date. Same user-owned RLS + realtime as 0007;
-- these are additive columns so no policy changes are needed.

alter table public.budget_items
  add column if not exists actual_cost int not null default 0; -- DKK, agreed price
alter table public.budget_items
  add column if not exists notes text;
alter table public.budget_items
  add column if not exists reminder_at date;                   -- in-app due date
