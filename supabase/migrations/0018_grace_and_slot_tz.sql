-- Two correctness fixes surfaced by the UA-launch audit.
--
-- 1) get_gallery_branding now returns grace_until, so the PUBLIC client gallery
--    can honour the grace window. Without it the page passed grace_until = null
--    and a photographer whose paid plan had lapsed kept paid perks (badge
--    removal, custom logo) on client galleries forever. The app already reads
--    branding.grace_until (null-safe), so applying this simply activates it.
--
-- 2) get_free_slots compared Kyiv wall-clock slot times against UTC "now",
--    leaving already-passed slots (within the UTC↔Kyiv offset) bookable. Compare
--    against Kyiv wall-clock instead.

-- 1) branding + grace_until -------------------------------------------------
drop function if exists public.get_gallery_branding(text);
create function public.get_gallery_branding(gallery_slug text)
returns table (
  display_name text,
  logo_key     text,
  plan         text,
  grace_until  timestamptz,
  site_theme   text,
  site_mode    text,
  tip_link     text
)
language sql
security definer set search_path = public
stable
as $$
  select
    p.display_name,
    p.logo_url,
    p.plan,
    p.grace_until,
    st.theme,
    st.mode,
    case when bs.manual_link_enabled then bs.manual_link end
  from public.galleries g
  join public.profiles p on p.user_id = g.owner_id
  left join public.sites st on st.user_id = g.owner_id
  left join public.booking_settings bs on bs.user_id = g.owner_id
  where g.slug = gallery_slug
    and g.is_published
    and (g.expires_at is null or g.expires_at > now());
$$;

-- 2) free slots compared in Kyiv wall-clock ---------------------------------
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
    -- booking_slots.starts_at holds Kyiv wall-clock (no tz); compare against
    -- Kyiv now, not UTC now, or recently-past slots stay bookable.
    and b.starts_at > (now() at time zone 'Europe/Kyiv')::timestamp
  order by b.starts_at;
$$;
