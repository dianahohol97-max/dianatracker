-- ============================================================================
-- Standalone portfolio: the photographer uploads showcase photos SEPARATELY
-- from client galleries — the site's portfolio block renders these, so it
-- never breaks when a client gallery expires or is deleted.
-- ============================================================================

create table public.portfolio_assets (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (user_id) on delete cascade,
  r2_key       text not null unique,
  content_type text not null,
  width        integer,
  height       integer,
  size_bytes   bigint not null check (size_bytes >= 0),
  variants     jsonb not null default '{}'::jsonb,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index portfolio_assets_owner_idx on public.portfolio_assets (owner_id, position, created_at);

alter table public.portfolio_assets enable row level security;

create policy "portfolio_assets: owner all"
  on public.portfolio_assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Portfolio bytes count toward the storage quota like everything else.
create trigger portfolio_storage_accounting
  after insert or delete on public.portfolio_assets
  for each row execute function public.apply_storage_delta();

-- Public read for the site's portfolio block (published sites only).
create or replace function public.get_site_portfolio(p_handle text)
returns table (
  id          uuid,
  preview_key text,
  width       integer,
  height      integer
)
language sql
security definer set search_path = public
stable
as $$
  select pa.id, coalesce(pa.variants ->> 'preview', pa.r2_key), pa.width, pa.height
  from public.sites st
  join public.portfolio_assets pa on pa.owner_id = st.user_id
  where st.handle = p_handle and st.is_published
  order by pa.position, pa.created_at
  limit 24;
$$;
