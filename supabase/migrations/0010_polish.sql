-- ============================================================================
-- Polish pass: watermark toggle, client tips, public-site sitemap feed.
-- ============================================================================

-- Watermark on gallery previews (photographer's display name, stamped in the
-- browser at upload time). Originals are NEVER touched.
alter table public.profiles
  add column watermark_enabled boolean not null default false;

-- Branding RPC also exposes a tip link: the photographer's manual payment
-- link (jar), shown as "подякувати фотографу" on plans with the tips feature.
drop function if exists public.get_gallery_branding(text);
create function public.get_gallery_branding(gallery_slug text)
returns table (
  display_name text,
  logo_key     text,
  plan         text,
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

-- Published photographer sites for the dynamic sitemap (their SEO promise).
create or replace function public.get_published_site_handles()
returns table (handle text, updated_at timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select st.handle, st.updated_at
  from public.sites st
  where st.is_published and st.handle is not null
  order by st.updated_at desc
  limit 5000;
$$;
