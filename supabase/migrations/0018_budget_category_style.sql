-- Per-category icon + color for budget lines. Standard categories get
-- defaults in the app; custom categories store the couple's picks here.

alter table public.budget_items
  add column if not exists icon text;
alter table public.budget_items
  add column if not exists color text;
