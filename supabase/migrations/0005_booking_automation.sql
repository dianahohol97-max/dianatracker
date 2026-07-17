-- ============================================================================
-- Booking automation:
--   1) auto-release: a booked-but-unpaid slot frees itself after N hours
--      (per-photographer setting; 0 disables). Runs lazily inside
--      get_free_slots and on dashboard load — no cron needed.
--   2) auto-confirm for manual methods: optional Monobank PERSONAL token
--      lets the server read the photographer's statement and match incoming
--      credits to booked slots — still "bank confirms, not the client".
-- ============================================================================

alter table public.booking_settings
  add column unpaid_release_hours  integer not null default 24
    check (unpaid_release_hours between 0 and 336),
  add column auto_confirm_manual   boolean not null default false,
  add column mono_personal_token   text,
  -- '0' = default card; a jar id can be pasted for jar links
  add column mono_personal_account text not null default '0',
  -- rate-limit marker: Monobank personal API allows 1 request per minute
  add column last_statement_check  timestamptz;

-- Frees expired unpaid bookings for one photographer. Only priced slots are
-- released (a free-of-charge booking has nothing to wait for). Returns the
-- number of released slots.
create or replace function public.release_expired_slots(p_owner uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  update public.booking_slots b
     set status = 'free',
         client_name = null,
         client_phone = null,
         client_email = null,
         booking_token = null,
         payment_method = null,
         invoice_id = null,
         booked_at = null
    from public.booking_settings s
   where s.user_id = b.owner_id
     and b.owner_id = p_owner
     and b.status = 'booked'
     and b.price_uah > 0
     and s.unpaid_release_hours > 0
     and b.booked_at < now() - make_interval(hours => s.unpaid_release_hours);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- get_free_slots now releases expired bookings first, so clients always see
-- times that timed out without payment.
drop function if exists public.get_free_slots(text);
create or replace function public.get_free_slots(p_handle text)
returns table (
  id               uuid,
  starts_at        timestamp,
  duration_minutes integer,
  price_uah        numeric
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
begin
  select s.user_id into v_owner
    from public.booking_settings s
   where s.handle = p_handle and s.enabled;
  if v_owner is null then
    return;
  end if;

  perform public.release_expired_slots(v_owner);

  return query
    select b.id, b.starts_at, b.duration_minutes, b.price_uah
      from public.booking_slots b
     where b.owner_id = v_owner
       and b.status = 'free'
       and b.starts_at > (now() at time zone 'utc')::timestamp
     order by b.starts_at;
end;
$$;
