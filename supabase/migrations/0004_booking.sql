-- ============================================================================
-- Booking: photographers sell time slots on a public page; money goes
-- DIRECTLY to the photographer (their Monobank/WayForPay credentials or
-- manual link/card), the platform is never an intermediary.
--
-- Access model: both tables are owner-only under RLS. The public page and
-- the booking action go EXCLUSIVELY through security-definer RPCs that
-- expose only safe fields — acquiring tokens/secrets never leave the server.
-- ============================================================================

create table public.booking_settings (
  user_id             uuid primary key references public.profiles (user_id) on delete cascade,
  enabled             boolean not null default false,
  -- public URL part: /b/<handle>
  handle              text unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,31}$'),
  -- where "new booking" emails go
  notify_email        text,
  -- Monobank acquiring (photographer's own token)
  mono_enabled        boolean not null default false,
  mono_token          text,
  -- WayForPay (photographer's own merchant)
  wfp_enabled         boolean not null default false,
  wfp_merchant        text,
  wfp_secret          text,
  -- Manual payment link (Mono jar / WFP link)
  manual_link_enabled boolean not null default false,
  manual_link         text,
  -- Plain card requisites shown as text
  card_enabled        boolean not null default false,
  card_details        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.booking_settings enable row level security;

create policy "booking_settings: owner all"
  on public.booking_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger booking_settings_touch_updated_at
  before update on public.booking_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Slots. starts_at is a WALL-CLOCK timestamp (no timezone): the photographer
-- enters 14:00, the client sees 14:00 — both are in Ukraine. Revisit when
-- the product goes multi-country.
-- ---------------------------------------------------------------------------
create table public.booking_slots (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (user_id) on delete cascade,
  starts_at        timestamp not null,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  price_uah        numeric(10, 2) not null default 0 check (price_uah >= 0),
  -- free -> booked -> paid; canceled is terminal
  status           text not null default 'free' check (status in ('free', 'booked', 'paid', 'canceled')),
  client_name      text,
  client_phone     text,
  client_email     text,
  -- returned only to the client who booked; authorizes payment initiation
  booking_token    uuid,
  payment_method   text check (payment_method in ('mono', 'wfp', 'manual', 'card')),
  invoice_id       text,
  booked_at        timestamptz,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

create index booking_slots_owner_idx on public.booking_slots (owner_id, starts_at);
create index booking_slots_invoice_idx on public.booking_slots (invoice_id) where invoice_id is not null;

alter table public.booking_slots enable row level security;

create policy "booking_slots: owner all"
  on public.booking_slots for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Public read: photographer card + payment-method availability. Secrets are
-- NOT in the return set — only booleans for auto methods; manual link and
-- card text are public by nature.
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_profile(p_handle text)
returns table (
  display_name text,
  logo_key     text,
  has_mono     boolean,
  has_wfp      boolean,
  manual_link  text,
  card_details text
)
language sql
security definer set search_path = public
stable
as $$
  select
    p.display_name,
    p.logo_url,
    (s.mono_enabled and coalesce(s.mono_token, '') <> ''),
    (s.wfp_enabled and coalesce(s.wfp_merchant, '') <> '' and coalesce(s.wfp_secret, '') <> ''),
    case when s.manual_link_enabled then s.manual_link end,
    case when s.card_enabled then s.card_details end
  from public.booking_settings s
  join public.profiles p on p.user_id = s.user_id
  where s.handle = p_handle and s.enabled;
$$;

create or replace function public.get_free_slots(p_handle text)
returns table (
  id               uuid,
  starts_at        timestamp,
  duration_minutes integer,
  price_uah        numeric
)
language sql
security definer set search_path = public
stable
as $$
  select b.id, b.starts_at, b.duration_minutes, b.price_uah
  from public.booking_slots b
  join public.booking_settings s on s.user_id = b.owner_id
  where s.handle = p_handle
    and s.enabled
    and b.status = 'free'
    and b.starts_at > (now() at time zone 'utc')::timestamp
  order by b.starts_at;
$$;

-- ---------------------------------------------------------------------------
-- Race-safe booking: the WHERE status = 'free' guard means two simultaneous
-- clients cannot book one slot — the second UPDATE matches zero rows and the
-- function returns null ("this time was just taken").
-- Booking does NOT depend on payment: the slot flips to booked immediately;
-- payment is confirmed separately (webhook or the photographer manually).
-- ---------------------------------------------------------------------------
create or replace function public.book_slot(
  p_slot  uuid,
  p_name  text,
  p_phone text,
  p_email text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_token uuid;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_email), '') = '' then
    raise exception 'missing_contact_fields';
  end if;

  update public.booking_slots b
     set status = 'booked',
         client_name = trim(p_name),
         client_phone = trim(p_phone),
         client_email = trim(p_email),
         booking_token = gen_random_uuid(),
         booked_at = now()
   where b.id = p_slot
     and b.status = 'free'
     and exists (
       select 1 from public.booking_settings s
       where s.user_id = b.owner_id and s.enabled
     )
  returning b.booking_token into v_token;

  return v_token; -- null = slot already taken
end;
$$;
