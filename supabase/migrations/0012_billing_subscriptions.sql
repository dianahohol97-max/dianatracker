-- Auto-renewal for one-off providers (monobank tokenized cards).
--
-- monobank acquiring has no native subscriptions: the card is tokenized on
-- the first checkout (saveCardData) and a daily cron charges the token when
-- the paid period runs out. One row per user per product (gallery / site).
--
-- statuses:
--   active   — cron charges the token at next_charge_at
--   canceled — user opted out; the plan runs out at next_charge_at
--              (gallery via profiles.grace_until, site via the cron sweep)
--   past_due — a charge failed; user re-subscribes from the billing page

create table public.billing_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (user_id) on delete cascade,
  product        text not null check (product in ('gallery', 'site')),
  plan           text not null,
  period         text not null check (period in ('month', 'year')),
  provider       text not null,
  card_token     text not null,
  next_charge_at timestamptz not null,
  status         text not null default 'active'
                 check (status in ('active', 'canceled', 'past_due')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, product)
);

create index billing_subscriptions_due_idx
  on public.billing_subscriptions (status, next_charge_at);

alter table public.billing_subscriptions enable row level security;

-- Owner sees their subscription state in the billing UI; every write goes
-- through the service role (webhook, cron, cancel route).
create policy "billing_subscriptions: owner read"
  on public.billing_subscriptions for select
  using (auth.uid() = user_id);

create trigger billing_subscriptions_touch
  before update on public.billing_subscriptions
  for each row execute function public.touch_updated_at();

-- Renewal payments point back at the subscription they extend, so the
-- webhook can advance next_charge_at when the charge lands.
alter table public.payments
  add column subscription_id uuid
  references public.billing_subscriptions (id) on delete set null;
