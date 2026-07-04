-- Coordination layer: all outreach flows through one platform "Kalas" Gmail
-- account, replies + vendor attachments land in a visual outreach inbox, and
-- Ava proposes responses the user approves. Also: invite design generation
-- (Nano Banana) and a Places result cache.
-- NOTE: google_tokens + poll_state are legacy (per-user Gmail, removed from
-- the app) — kept in place to avoid a destructive migration.

-- 1. Platform Gmail account (single row; service-role only, like google_tokens)
create table public.platform_gmail_tokens (
  id int primary key default 1 check (id = 1),
  google_email text not null,
  refresh_token_enc text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  last_history_id text,
  last_polled_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.platform_gmail_tokens enable row level security; -- no policies

-- 2. Per-event outreach tag for plus-addressing (kalas+<tag>@domain)
alter table public.events add column reply_tag text unique;

-- 3. Outbound emails become thread messages (initial outreach or our reply)
alter table public.outbound_emails
  add column kind text not null default 'outreach'
    check (kind in ('outreach', 'reply')),
  add column in_reply_to_reply_id uuid references public.email_replies(id) on delete set null;
create index outbound_emails_thread_global_idx on public.outbound_emails(gmail_thread_id);

-- 4. Inbound reply metadata: RFC 822 Message-ID for threading, unread state
alter table public.email_replies
  add column rfc822_message_id text,
  add column read_at timestamptz;

-- 5. Vendor attachments (Gmail -> Supabase Storage)
create table public.email_attachments (
  id uuid primary key default gen_random_uuid(),
  email_reply_id uuid not null references public.email_replies(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  mime_type text,
  size_bytes int,
  storage_path text not null, -- {user_id}/{event_id}/{reply_id}/{filename} in vendor-files
  created_at timestamptz not null default now()
);
create index email_attachments_event_idx on public.email_attachments(event_id);

-- 6. Ava's proposed responses to vendor replies (the approval loop)
create table public.reply_proposals (
  id uuid primary key default gen_random_uuid(),
  email_reply_id uuid not null references public.email_replies(id) on delete cascade,
  outbound_email_id uuid not null references public.outbound_emails(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'proposed'
    check (status in ('proposed', 'sent', 'dismissed', 'superseded')),
  sent_outbound_id uuid references public.outbound_emails(id) on delete set null,
  created_at timestamptz not null default now()
);
create index reply_proposals_event_idx on public.reply_proposals(event_id);
create index reply_proposals_reply_idx on public.reply_proposals(email_reply_id);

-- 7. Category-scoped drafts; vendor booked state
alter table public.email_drafts add column category text not null default 'venue'
  check (category in ('venue', 'florist', 'photographer', 'musician', 'caterer', 'planner', 'other'));
alter table public.venues add column booked_at timestamptz;

-- 8. Generated invite designs (Nano Banana options)
create table public.invite_designs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  style text,
  palette text,
  storage_path text not null, -- {user_id}/{event_id}/{id}.png in invite-designs
  selected boolean not null default false,
  created_at timestamptz not null default now()
);
create index invite_designs_event_idx on public.invite_designs(event_id);

-- 9. Places API result cache (service-role only, best-effort)
create table public.places_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.places_cache enable row level security; -- no policies

-- RLS: own rows (same pattern as 0001)
alter table public.email_attachments enable row level security;
alter table public.reply_proposals enable row level security;
alter table public.invite_designs enable row level security;
create policy "own email_attachments" on public.email_attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reply_proposals" on public.reply_proposals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own invite_designs" on public.invite_designs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime for the inbox UI (outbound_emails/email_replies already published)
alter publication supabase_realtime add table public.reply_proposals;
alter publication supabase_realtime add table public.email_attachments;

-- Storage: private buckets; owner-read via path prefix = user_id.
-- Writes go through the service-role client only (no insert policies).
insert into storage.buckets (id, name, public) values
  ('vendor-files', 'vendor-files', false),
  ('invite-designs', 'invite-designs', false)
on conflict (id) do nothing;

create policy "own vendor files" on storage.objects for select
  using (bucket_id = 'vendor-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own invite designs" on storage.objects for select
  using (bucket_id = 'invite-designs' and (storage.foldername(name))[1] = auth.uid()::text);
