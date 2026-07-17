-- ============================================================================
-- Branding for public galleries + payments (subscription tiers).
-- ============================================================================

-- Public galleries must show the photographer's name/logo, but profiles are
-- owner-only under RLS. This security-definer RPC exposes EXACTLY the two
-- branding fields, and only through a published, non-expired gallery.
create or replace function public.get_gallery_branding(gallery_slug text)
returns table (display_name text, logo_key text)
language sql
security definer set search_path = public
stable
as $$
  select p.display_name, p.logo_url
  from public.galleries g
  join public.profiles p on p.user_id = g.owner_id
  where g.slug = gallery_slug
    and g.is_published
    and (g.expires_at is null or g.expires_at > now());
$$;

-- ---------------------------------------------------------------------------
-- payments — one row per checkout attempt. Written only by the server with
-- the service-role key (checkout route + provider webhook); owners can read
-- their own history. No insert/update policies on purpose.
-- ---------------------------------------------------------------------------
create table public.payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (user_id) on delete cascade,
  provider   text not null,
  order_id   text not null unique,
  plan       text not null,
  period     text not null check (period in ('month', 'year')),
  amount     numeric(10, 2) not null,
  currency   text not null,
  status     text not null default 'pending',
  raw        jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_user_idx on public.payments (user_id, created_at);

alter table public.payments enable row level security;

create policy "payments: owner read"
  on public.payments for select
  using (auth.uid() = user_id);

create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();
