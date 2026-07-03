-- Invitation orders: Stripe Checkout now, Gelato print/drop-ship later
-- (design_file_url + submitted_to_print/shipped statuses anticipate it).

create table public.invite_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  style text,
  palette text,
  wording text,
  quantity int not null,
  design_file_url text,              -- future: Gelato-ready print file
  amount_cents int,
  currency text not null default 'usd',
  stripe_session_id text,
  stripe_payment_intent text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_payment', 'paid', 'submitted_to_print', 'shipped', 'canceled')),
  created_at timestamptz not null default now()
);

create index invite_orders_event_id_idx on public.invite_orders(event_id);

alter table public.invite_orders enable row level security;

create policy "own invite orders" on public.invite_orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
