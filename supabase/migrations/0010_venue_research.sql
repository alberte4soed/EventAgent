-- Rich LLM research profile for a single venue (briefing, packages, practical info).
alter table venues
  add column if not exists venue_research jsonb;
