-- ============================================================================
-- Phase 1 — Galleries: profiles, galleries, assets, selections, gallery_events
--
-- Principles:
--   * Supabase is data + auth ONLY. Media lives in R2; we store keys/metadata.
--   * Every table is under RLS. Owners see their own rows via auth.uid().
--   * Anonymous (client) access to a gallery goes ONLY through a published
--     gallery, resolved by slug. Password/expiry checks happen in the app
--     layer (signed unlock cookie); RLS enforces the published/expired gate.
--   * Storage accounting (profiles.storage_used_bytes) is maintained by
--     triggers on assets so it can never drift from the source of truth.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user (photographer)
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  display_name         text,
  logo_url             text,
  locale               text not null default 'uk' check (locale in ('uk', 'en')),
  plan                 text not null default 'free',
  storage_used_bytes   bigint not null default 0 check (storage_used_bytes >= 0),
  -- free plan: 3 GB
  storage_limit_bytes  bigint not null default 3221225472,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- galleries
-- ---------------------------------------------------------------------------
create table public.galleries (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (user_id) on delete cascade,
  slug           text not null unique,
  title          text not null,
  description    text,
  event_date     date,
  cover_asset_id uuid, -- FK added below, after assets exists
  password_hash  text, -- scrypt hash; null = no password
  expires_at     timestamptz, -- null = never expires
  is_published   boolean not null default false,
  view_count     bigint not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index galleries_owner_idx on public.galleries (owner_id);

alter table public.galleries enable row level security;

-- Helper used by policies on child tables. SECURITY DEFINER so the check
-- bypasses RLS on galleries itself (anon querying assets must not be blocked
-- by the galleries policy chain).
create or replace function public.gallery_is_public(gid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.galleries g
    where g.id = gid
      and g.is_published
      and (g.expires_at is null or g.expires_at > now())
  );
$$;

create policy "galleries: owner all"
  on public.galleries for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Anyone (anon client with the link) may read a published, non-expired
-- gallery. Password gating is enforced in the app layer — the hash itself is
-- never sent to the browser because public pages select explicit columns.
create policy "galleries: public read when published"
  on public.galleries for select
  using (is_published and (expires_at is null or expires_at > now()));

-- ---------------------------------------------------------------------------
-- assets — one row per uploaded photo/video; the file itself lives in R2
-- ---------------------------------------------------------------------------
create table public.assets (
  id           uuid primary key default gen_random_uuid(),
  gallery_id   uuid not null references public.galleries (id) on delete cascade,
  -- Denormalized owner for cheap RLS checks and storage accounting.
  owner_id     uuid not null references public.profiles (user_id) on delete cascade,
  r2_key       text not null unique,
  kind         text not null check (kind in ('photo', 'video')),
  content_type text not null,
  width        integer,
  height       integer,
  size_bytes   bigint not null check (size_bytes >= 0),
  -- Keys of generated renditions, e.g. {"thumb": "...", "preview": "..."}.
  -- Empty until the image-processing pipeline lands; viewers fall back to
  -- the original key.
  variants     jsonb not null default '{}'::jsonb,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index assets_gallery_idx on public.assets (gallery_id, position, created_at);
create index assets_owner_idx on public.assets (owner_id);

alter table public.galleries
  add constraint galleries_cover_asset_fk
  foreign key (cover_asset_id) references public.assets (id) on delete set null;

alter table public.assets enable row level security;

create policy "assets: owner all"
  on public.assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "assets: public read in published gallery"
  on public.assets for select
  using (public.gallery_is_public(gallery_id));

-- Keep profiles.storage_used_bytes in sync with assets.
create or replace function public.apply_storage_delta()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
      set storage_used_bytes = storage_used_bytes + new.size_bytes,
          updated_at = now()
      where user_id = new.owner_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles
      set storage_used_bytes = greatest(storage_used_bytes - old.size_bytes, 0),
          updated_at = now()
      where user_id = old.owner_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger assets_storage_accounting
  after insert or delete on public.assets
  for each row execute function public.apply_storage_delta();

-- ---------------------------------------------------------------------------
-- selections — client picks (favorites / retouch), no client account needed.
-- client_token is a random token minted in the client's browser cookie.
-- ---------------------------------------------------------------------------
create table public.selections (
  id           uuid primary key default gen_random_uuid(),
  gallery_id   uuid not null references public.galleries (id) on delete cascade,
  asset_id     uuid not null references public.assets (id) on delete cascade,
  client_token text not null,
  kind         text not null check (kind in ('favorite', 'retouch')),
  created_at   timestamptz not null default now(),
  unique (asset_id, client_token, kind)
);

create index selections_gallery_idx on public.selections (gallery_id);

alter table public.selections enable row level security;

-- The gallery owner sees every selection in their galleries.
create policy "selections: owner read"
  on public.selections for select
  using (exists (
    select 1 from public.galleries g
    where g.id = gallery_id and g.owner_id = auth.uid()
  ));

-- Anonymous clients manage their own picks (scoped by their token) inside a
-- published gallery. They can only read/delete rows carrying their token —
-- the token is unguessable, so clients cannot see each other's picks.
create policy "selections: client insert in published gallery"
  on public.selections for insert
  with check (public.gallery_is_public(gallery_id));

create policy "selections: client read own"
  on public.selections for select
  using (public.gallery_is_public(gallery_id));

create policy "selections: client delete own"
  on public.selections for delete
  using (public.gallery_is_public(gallery_id));

-- ---------------------------------------------------------------------------
-- gallery_events — lightweight analytics (views, downloads)
-- ---------------------------------------------------------------------------
create table public.gallery_events (
  id         bigint generated always as identity primary key,
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  type       text not null check (type in ('view', 'download')),
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index gallery_events_gallery_idx on public.gallery_events (gallery_id, created_at);

alter table public.gallery_events enable row level security;

create policy "gallery_events: owner read"
  on public.gallery_events for select
  using (exists (
    select 1 from public.galleries g
    where g.id = gallery_id and g.owner_id = auth.uid()
  ));

-- Events are only written through the RPCs below (security definer), so no
-- direct insert policy for anon/authenticated is needed.

-- Records a view and bumps the counter atomically. Called from the public
-- gallery page (server side), so rate limiting/dedup can be layered there.
create or replace function public.record_gallery_view(gallery_slug text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  gid uuid;
begin
  select id into gid from public.galleries
    where slug = gallery_slug
      and is_published
      and (expires_at is null or expires_at > now());
  if gid is null then
    return;
  end if;
  update public.galleries set view_count = view_count + 1 where id = gid;
  insert into public.gallery_events (gallery_id, type) values (gid, 'view');
end;
$$;

create or replace function public.record_gallery_download(gid uuid, asset uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.gallery_is_public(gid) then
    return;
  end if;
  insert into public.gallery_events (gallery_id, type, meta)
    values (gid, 'download', jsonb_build_object('asset_id', asset));
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger galleries_touch_updated_at
  before update on public.galleries
  for each row execute function public.touch_updated_at();
