-- EventAgent initial schema
-- Events being planned by a user
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New event',
  event_type text,
  location text,
  guest_count int,
  event_date date,
  budget text,
  requirements jsonb not null default '{}'::jsonb,
  status text not null default 'gathering'
    check (status in ('gathering','searching','swiping','drafting','sending','awaiting_replies','done')),
  created_at timestamptz not null default now()
);

-- Chat transcript per event; payload lets the UI render rich blocks inline
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null default '',
  payload jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_event_idx on public.chat_messages(event_id, created_at);

-- Venue options found by the agent, swiped by the user
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  address text,
  website text,
  email text,
  phone text,
  capacity text,
  price_hint text,
  image_url text,
  source_urls jsonb not null default '[]'::jsonb,
  swipe_status text not null default 'pending'
    check (swipe_status in ('pending','liked','rejected')),
  email_lookup_status text not null default 'not_needed'
    check (email_lookup_status in ('not_needed','pending','found','not_found')),
  created_at timestamptz not null default now()
);
create index venues_event_idx on public.venues(event_id);

-- Master quote-request drafts proposed by the agent
create table public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body_template text not null,
  status text not null default 'proposed'
    check (status in ('proposed','approved','sent')),
  version int not null default 1,
  created_at timestamptz not null default now()
);
create index email_drafts_event_idx on public.email_drafts(event_id);

-- Personalized emails actually sent through the user's Gmail
create table public.outbound_emails (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  draft_id uuid references public.email_drafts(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  to_email text not null,
  subject text not null,
  body text not null,
  gmail_message_id text,
  gmail_thread_id text,
  status text not null default 'queued'
    check (status in ('queued','sent','failed','replied')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index outbound_emails_thread_idx on public.outbound_emails(user_id, gmail_thread_id);
create index outbound_emails_event_idx on public.outbound_emails(event_id);

-- Replies pulled in by the polling job, with Gemini-extracted quotes
create table public.email_replies (
  id uuid primary key default gen_random_uuid(),
  outbound_email_id uuid not null references public.outbound_emails(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_message_id text not null unique,
  from_email text,
  snippet text,
  body text,
  received_at timestamptz,
  quote jsonb,
  quote_status text check (quote_status in ('quoted','no_availability','needs_info','unclear')),
  created_at timestamptz not null default now()
);
create index email_replies_event_idx on public.email_replies(event_id);

-- Gmail OAuth tokens; service-role access only (RLS with no policies)
create table public.google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_email text,
  refresh_token_enc text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Incremental polling cursor per user; service-role access only
create table public.poll_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_history_id text,
  last_polled_at timestamptz
);

-- Row Level Security
alter table public.events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.venues enable row level security;
alter table public.email_drafts enable row level security;
alter table public.outbound_emails enable row level security;
alter table public.email_replies enable row level security;
alter table public.google_tokens enable row level security;  -- no policies: service-role only
alter table public.poll_state enable row level security;     -- no policies: service-role only

create policy "own events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own chat_messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own venues" on public.venues
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own email_drafts" on public.email_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own outbound_emails" on public.outbound_emails
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own email_replies" on public.email_replies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime for live chat + quote updates
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.venues;
alter publication supabase_realtime add table public.outbound_emails;
alter publication supabase_realtime add table public.email_replies;
