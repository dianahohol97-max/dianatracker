-- ============================================================================
-- Phase 2 — Sites (constructor). One site per photographer for now.
-- A theme is ONLY a token set; blocks are shared. The public page never
-- mentions the platform. Owner-only under RLS; public reads go through
-- security-definer RPCs.
-- ============================================================================

create table public.sites (
  user_id      uuid primary key references public.profiles (user_id) on delete cascade,
  handle       text unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,31}$'),
  theme        text not null default 'tysha'
    check (theme in ('tysha', 'povitria', 'plivka', 'zhurnal', 'galereia', 'arkhiv', 'prodakshn')),
  -- 'night' is the token inversion (Тиша ⇄ Опівніч); same blocks either way
  mode         text not null default 'light' check (mode in ('light', 'night')),
  is_published boolean not null default false,
  -- block contents: hero/about/pricing/contact (see src/lib/site/content.ts)
  content      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.sites enable row level security;

create policy "sites: owner all"
  on public.sites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger sites_touch_updated_at
  before update on public.sites
  for each row execute function public.touch_updated_at();

-- Public site payload: theme/mode/content + branding. Published sites only.
create or replace function public.get_site(p_handle text)
returns table (
  theme        text,
  mode         text,
  content      jsonb,
  display_name text,
  logo_key     text
)
language sql
security definer set search_path = public
stable
as $$
  select st.theme, st.mode, st.content, p.display_name, p.logo_url
  from public.sites st
  join public.profiles p on p.user_id = st.user_id
  where st.handle = p_handle and st.is_published;
$$;

-- Portfolio block source: the photographer's published galleries with a
-- cover (explicit cover asset, else the first asset). Preview keys only —
-- signing happens server-side at render time.
create or replace function public.get_site_galleries(p_handle text)
returns table (
  slug        text,
  title       text,
  preview_key text
)
language sql
security definer set search_path = public
stable
as $$
  select g.slug, g.title, cover.k
  from public.sites st
  join public.galleries g
    on g.owner_id = st.user_id
   and g.is_published
   and (g.expires_at is null or g.expires_at > now())
  left join lateral (
    select coalesce(x.variants ->> 'preview', x.r2_key) as k
    from public.assets x
    where (g.cover_asset_id is not null and x.id = g.cover_asset_id)
       or (g.cover_asset_id is null and x.gallery_id = g.id)
    order by x.position, x.created_at
    limit 1
  ) cover on true
  where st.handle = p_handle and st.is_published
  order by g.created_at desc
  limit 12;
$$;
